import express from 'express';
import { templateManager } from '../template-manager.js';
import path from 'path';
import fs from 'fs/promises';
import { getImageCostPoints } from '../services/point-service.js';

const router = express.Router();
const DEFAULT_HIDDEN_TEMPLATE_IDS = ['customPrompt', 'polaroid'];

function serializeTemplate(t) {
  return {
    id: t.id,
    name: t.name,
    name_en: t.name_en,
    alias: t.alias || [],
    description: t.description,
    description_en: t.description_en,
    emoji: t.emoji,
    order: t.order,
    click_count: t.click_count,
    is_active: t.is_active,
    is_featured: t.is_featured,
    max_images: t.max_images,
    is_custom: t.is_custom,
    tags: t.tags || [],
    price: t.price || null,
    point_cost: getImageCostPoints(t),
    preview_version: t.preview_version,
    preview_url: t.preview_url,
    cover_version: t.cover_version || null,
    cover_url: t.cover_url || null
  };
}

function getHiddenTemplateIds() {
  const envIds = (process.env.HIDDEN_TEMPLATE_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);

  return Array.from(new Set([...DEFAULT_HIDDEN_TEMPLATE_IDS, ...envIds]));
}

router.get('/', (req, res) => {
  try {
    const { sort, featured, tags } = req.query;
    const hiddenIds = new Set(getHiddenTemplateIds());
    const templates = templateManager
      .getTemplates({ sort, featured, tags })
      .filter((template) => !hiddenIds.has(template.id));
    
    const templatesList = templates.map(serializeTemplate);
    
    res.json({ 
      success: true, 
      templates: templatesList,
      total: templatesList.length
    });
  } catch (error) {
    console.error('Error in GET /templates:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get templates' 
    });
  }
});

router.get('/:id', (req, res) => {
  try {
    const template = templateManager.getTemplate(req.params.id);
    
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        error: 'Template not found' 
      });
    }
    
    res.json({ 
      success: true, 
      template: serializeTemplate(template)
    });
  } catch (error) {
    console.error(`Error in GET /templates/${req.params.id}:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get template' 
    });
  }
});

async function sendTemplateImage(req, res, { getPath, missingMessage }) {
  try {
    const template = templateManager.getTemplate(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

    const imagePath = getPath(req.params.id);

    try {
      await fs.access(imagePath);
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.sendFile(imagePath);
    } catch {
      res.status(404).json({
        success: false,
        error: missingMessage
      });
    }
  } catch (error) {
    console.error(`Error in GET ${req.originalUrl}:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get template image'
    });
  }
}

router.get('/:id/preview', async (req, res) => {
  await sendTemplateImage(req, res, {
    getPath: (id) => templateManager.getPreviewPath(id),
    missingMessage: 'Preview image not found'
  });
});

router.get('/:id/cover', async (req, res) => {
  await sendTemplateImage(req, res, {
    getPath: (id) => templateManager.getCoverPath(id),
    missingMessage: 'Cover image not found'
  });
});

router.post('/:id/click', async (req, res) => {
  try {
    await templateManager.incrementClickCount(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error(`Error in POST /templates/${req.params.id}/click:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to update click count' 
    });
  }
});

export default router;
