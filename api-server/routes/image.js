import express from 'express';
import { adapterFactory } from '../adapters/index.js';
import { config } from '../config/index.js';
import { templateManager } from '../template-manager.js';
import { getUserFromRequest } from '../middleware/auth.js';
import { withTransaction } from '../db/pool.js';
import {
  consumePoints,
  getImageCostPoints,
  InsufficientPointsError,
  refundPoints
} from '../services/point-service.js';
import {
  createGenerationRecord,
  markGenerationFailed,
  markGenerationSuccess
} from '../services/generation-service.js';

const router = express.Router();

function isImageMockEnabled() {
  return process.env.ENABLE_IMAGE_MOCK === 'true' || process.env.ENABLE_MOCK === 'true';
}

function getPublicBaseUrl(req) {
  return process.env.PUBLIC_API_BASE_URL || `${req.protocol}://${req.get('host')}`;
}

function createMockImageResult(req, { templateId, model, hasInputImages }) {
  const mockTemplateId = templateId && templateManager.getTemplate(templateId)
    ? templateId
    : 'customPrompt';

  return {
    success: true,
    imageUrl: `${getPublicBaseUrl(req)}/api/templates/${mockTemplateId}/preview?mock=${Date.now()}`,
    text: hasInputImages
      ? 'Mock edited image result'
      : 'Mock generated image result',
    metadata: {
      provider: 'mock',
      model,
      mock: true,
      timestamp: new Date().toISOString()
    }
  };
}

function normalizeImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images.map((image) => ({
    ...image,
    base64: image.base64 || image.data,
  }));
}

function validateImages(images) {
  for (const image of images) {
    if (!image.base64 || !image.mimeType) {
      return 'Each image must have base64 and mimeType properties';
    }
  }

  return null;
}

function validateTemplateImageLimit(template, images) {
  if (!template) {
    return null;
  }

  const maxImages = Number(template.max_images ?? template.maxImages);
  if (!Number.isFinite(maxImages) || maxImages < 0) {
    return null;
  }

  if (images.length > maxImages) {
    return `Template ${template.id} accepts at most ${maxImages} image${maxImages === 1 ? '' : 's'}`;
  }

  return null;
}

function createInputImagesPreview(images) {
  if (!Array.isArray(images) || images.length === 0) {
    return null;
  }

  const previewImages = images
    .filter((image) => image.base64 && image.mimeType)
    .slice(0, 4)
    .map((image) => ({
      mimeType: image.mimeType,
      dataUrl: `data:${image.mimeType};base64,${image.base64}`
    }));

  return previewImages.length > 0 ? JSON.stringify(previewImages) : null;
}

function parseInputImagesPreview(value) {
  if (!value) return null;

  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

async function chargeForGeneration({ user, templateId, model, prompt, inputImagesCount, inputImagesPreview, costPoints }) {
  return withTransaction(async (connection) => {
    const recordId = await createGenerationRecord(connection, {
      userId: user.id,
      templateId,
      model,
      prompt,
      inputImagesCount,
      inputImagesPreview,
      costPoints
    });

    const remainingPoints = await consumePoints(connection, {
      userId: user.id,
      amount: costPoints,
      reason: 'image_generation',
      relatedType: 'generation_record',
      relatedId: recordId
    });

    return { recordId, remainingPoints };
  });
}

async function finishGenerationSuccess({ recordId, outputUrl }) {
  await withTransaction(async (connection) => {
    await markGenerationSuccess(connection, { recordId, outputUrl });
  });
}

async function finishGenerationFailure({ userId, recordId, costPoints, errorMessage }) {
  await withTransaction(async (connection) => {
    await markGenerationFailed(connection, { recordId, errorMessage });

    if (costPoints > 0) {
      await refundPoints(connection, {
        userId,
        amount: costPoints,
        reason: 'image_generation_failed_refund',
        relatedType: 'generation_record',
        relatedId: recordId
      });
    }
  });
}

router.post('/generate', async (req, res) => {
  let user = null;
  let recordId = null;
  let costPoints = 0;
  let finalized = false;

  try {
    const { model, prompt, templateId, customPrompt, aspectRatio, quality, style, images: rawImages, mask, ...options } = req.body;
    
    if (!model) {
      return res.status(400).json({ 
        success: false, 
        error: 'Model is required. Format: provider/model-name' 
      });
    }
    
    let finalPrompt = prompt;
    let selectedTemplate = null;
    
    if (templateId) {
      selectedTemplate = templateManager.getTemplate(templateId);
      if (!selectedTemplate) {
        return res.status(400).json({ 
          success: false, 
          error: `Template not found: ${templateId}` 
        });
      }
      
      if (selectedTemplate.is_custom) {
        if (!customPrompt || typeof customPrompt !== 'string' || customPrompt.trim() === '') {
          return res.status(400).json({ 
            success: false, 
            error: 'Custom prompt is required for custom template' 
          });
        }
        finalPrompt = customPrompt;
      } else {
        finalPrompt = selectedTemplate.prompt;
      }
    }
    
    if (!finalPrompt || typeof finalPrompt !== 'string' || finalPrompt.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required and must be a non-empty string' 
      });
    }
    
    const images = normalizeImages(rawImages);
    const imageValidationError = validateImages(images);
    if (images.length > 0 && imageValidationError) {
      return res.status(400).json({
        success: false,
        error: imageValidationError
      });
    }
    const imageLimitError = validateTemplateImageLimit(selectedTemplate, images);
    if (imageLimitError) {
      return res.status(400).json({
        success: false,
        error: imageLimitError
      });
    }
    if (templateId) {
      await templateManager.incrementClickCount(templateId);
    }

    try {
      user = await getUserFromRequest(req);
    } catch (authError) {
      return res.status(authError.statusCode || 401).json({
        success: false,
        error: authError.message || 'Invalid authorization token'
      });
    }

    const modelName = model.split('/')[1];
    const hasInputImages = Array.isArray(images) && images.length > 0;
    const template = selectedTemplate;
    costPoints = getImageCostPoints(template);

    let remainingPoints;
    try {
      const charged = await chargeForGeneration({
        user,
        templateId,
        model,
        prompt: finalPrompt,
        inputImagesCount: images.length,
        inputImagesPreview: createInputImagesPreview(images),
        costPoints
      });
      recordId = charged.recordId;
      remainingPoints = charged.remainingPoints;
    } catch (error) {
      if (error instanceof InsufficientPointsError) {
        return res.status(402).json({
          success: false,
          error: 'Insufficient points',
          requiredPoints: error.requiredPoints,
          currentPoints: error.currentPoints
        });
      }

      throw error;
    }

    const result = isImageMockEnabled()
      ? createMockImageResult(req, { templateId, model, hasInputImages })
      : hasInputImages
        ? await adapterFactory.getAdapterForModel(model).editImage({
            model: modelName,
            prompt: finalPrompt,
            images,
            mask,
            aspectRatio,
            quality,
            style,
            ...options
          })
        : await adapterFactory.getAdapterForModel(model).generateImage({
            model: modelName,
            prompt: finalPrompt,
            aspectRatio,
            quality,
            style,
            ...options
          });
    
    if (result.success) {
      await finishGenerationSuccess({
        recordId,
        outputUrl: result.imageUrl
      });
      finalized = true;

      res.json({
        ...result,
        generationRecordId: recordId,
        points: {
          cost: costPoints,
          remaining: remainingPoints
        }
      });
    } else {
      await finishGenerationFailure({
        userId: user.id,
        recordId,
        costPoints,
        errorMessage: result.error
      });
      finalized = true;

      res.status(400).json({
        ...result,
        generationRecordId: recordId,
        pointsRefunded: costPoints
      });
    }
  } catch (error) {
    if (user && recordId && !finalized) {
      try {
        await finishGenerationFailure({
          userId: user.id,
          recordId,
          costPoints,
          errorMessage: error.message
        });
      } catch (recordError) {
        console.error('Failed to mark generation as failed:', recordError);
      }
    }

    console.error('Error in /generate:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred',
      generationRecordId: recordId || undefined,
      pointsRefunded: recordId ? costPoints : undefined
    });
  }
});

router.post('/edit', async (req, res) => {
  let user = null;
  let recordId = null;
  let costPoints = 0;
  let finalized = false;

  try {
    const { model, prompt, images, mask, aspectRatio, ...options } = req.body;
    
    if (!model) {
      return res.status(400).json({ 
        success: false, 
        error: 'Model is required. Format: provider/model-name' 
      });
    }
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required and must be a non-empty string' 
      });
    }
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Images array is required and must not be empty' 
      });
    }
    
    for (const image of images) {
      if (!image.base64 || !image.mimeType) {
        return res.status(400).json({ 
          success: false, 
          error: 'Each image must have base64 and mimeType properties' 
        });
      }
    }

    try {
      user = await getUserFromRequest(req);
    } catch (authError) {
      return res.status(authError.statusCode || 401).json({
        success: false,
        error: authError.message || 'Invalid authorization token'
      });
    }
    
    costPoints = getImageCostPoints(null);

    let remainingPoints;
    try {
      const charged = await chargeForGeneration({
        user,
        templateId: null,
        model,
        prompt,
        inputImagesCount: images.length,
        inputImagesPreview: createInputImagesPreview(images),
        costPoints
      });
      recordId = charged.recordId;
      remainingPoints = charged.remainingPoints;
    } catch (error) {
      if (error instanceof InsufficientPointsError) {
        return res.status(402).json({
          success: false,
          error: 'Insufficient points',
          requiredPoints: error.requiredPoints,
          currentPoints: error.currentPoints
        });
      }

      throw error;
    }
    
    const result = isImageMockEnabled()
      ? createMockImageResult(req, { templateId: null, model, hasInputImages: true })
      : await adapterFactory.getAdapterForModel(model).editImage({
          model: model.split('/')[1],
          prompt,
          images,
          mask,
          aspectRatio,
          ...options
        });
    
    if (result.success) {
      await finishGenerationSuccess({
        recordId,
        outputUrl: result.imageUrl
      });
      finalized = true;

      res.json({
        ...result,
        generationRecordId: recordId,
        points: {
          cost: costPoints,
          remaining: remainingPoints
        }
      });
    } else {
      await finishGenerationFailure({
        userId: user.id,
        recordId,
        costPoints,
        errorMessage: result.error
      });
      finalized = true;

      res.status(400).json({
        ...result,
        generationRecordId: recordId,
        pointsRefunded: costPoints
      });
    }
  } catch (error) {
    if (user && recordId && !finalized) {
      try {
        await finishGenerationFailure({
          userId: user.id,
          recordId,
          costPoints,
          errorMessage: error.message
        });
      } catch (recordError) {
        console.error('Failed to mark edit generation as failed:', recordError);
      }
    }

    console.error('Error in /edit:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An unexpected error occurred',
      generationRecordId: recordId || undefined,
      pointsRefunded: recordId ? costPoints : undefined
    });
  }
});

router.get('/models', (req, res) => {
  try {
    const isMockMode = isImageMockEnabled();
    
    if (isMockMode) {
      const allModels = config.getAllModels();
      return res.json({ 
        success: true, 
        models: allModels,
        providers: ['gemini', 'openai', 'tongyi'],
        mock: true
      });
    }
    
    const models = config.getAllModels();
    const enabledProviders = config.getEnabledProviders();
    
    const availableModels = models.filter(model => {
      const provider = model.id.split('/')[0];
      return enabledProviders[provider] !== undefined;
    });
    
    res.json({ 
      success: true, 
      models: availableModels,
      providers: Object.keys(enabledProviders)
    });
  } catch (error) {
    console.error('Error in /models:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    });
  }
});

router.get('/default-model', (req, res) => {
  try {
    const defaultModel = config.getDefaultModel();
    res.json({ 
      success: true, 
      model: defaultModel 
    });
  } catch (error) {
    console.error('Error in /default-model:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    });
  }
});

router.get('/providers', (req, res) => {
  try {
    const providers = config.getEnabledProviders();
    
    const providerList = Object.entries(providers).map(([name, providerConfig]) => ({
      id: name,
      name: providerConfig.name,
      models: providerConfig.models.map(m => ({
        id: `${name}/${m.id}`,
        name: m.name,
        ...m
      }))
    }));
    
    res.json({ 
      success: true, 
      providers: providerList 
    });
  } catch (error) {
    console.error('Error in /providers:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    });
  }
});

export default router;
