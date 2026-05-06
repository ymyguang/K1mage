import express from 'express';
import { adapterFactory } from '../adapters/index.js';
import { config } from '../config/index.js';
import { templateManager } from '../template-manager.js';

const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const { model, prompt, templateId, customPrompt, aspectRatio, quality, style, ...options } = req.body;
    
    if (!model) {
      return res.status(400).json({ 
        success: false, 
        error: 'Model is required. Format: provider/model-name' 
      });
    }
    
    let finalPrompt = prompt;
    
    if (templateId) {
      const template = templateManager.getTemplate(templateId);
      if (!template) {
        return res.status(400).json({ 
          success: false, 
          error: `Template not found: ${templateId}` 
        });
      }
      
      if (template.is_custom) {
        if (!customPrompt || typeof customPrompt !== 'string' || customPrompt.trim() === '') {
          return res.status(400).json({ 
            success: false, 
            error: 'Custom prompt is required for custom template' 
          });
        }
        finalPrompt = customPrompt;
      } else {
        finalPrompt = template.prompt;
      }
      
      await templateManager.incrementClickCount(templateId);
    }
    
    if (!finalPrompt || typeof finalPrompt !== 'string' || finalPrompt.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'Prompt is required and must be a non-empty string' 
      });
    }
    
    const adapter = adapterFactory.getAdapterForModel(model);
    
    const result = await adapter.generateImage({
      model: model.split('/')[1],
      prompt: finalPrompt,
      aspectRatio,
      quality,
      style,
      ...options
    });
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in /generate:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    });
  }
});

router.post('/edit', async (req, res) => {
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
    
    const adapter = adapterFactory.getAdapterForModel(model);
    
    const result = await adapter.editImage({
      model: model.split('/')[1],
      prompt,
      images,
      mask,
      aspectRatio,
      ...options
    });
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error in /edit:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    });
  }
});

router.get('/models', (req, res) => {
  try {
    const isMockMode = process.env.ENABLE_MOCK === 'true';
    
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
