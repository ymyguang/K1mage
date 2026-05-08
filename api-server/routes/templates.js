import express from 'express';
import { templateManager } from '../template-manager.js';
import path from 'path';
import fs from 'fs/promises';
import { getImageCostPoints } from '../services/point-service.js';

const router = express.Router();

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
    preview_url: t.preview_url
  };
}

function getHiddenTemplateIds() {
  return (process.env.HIDDEN_TEMPLATE_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
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
    if (getHiddenTemplateIds().includes(req.params.id)) {
      return res.status(404).json({
        success: false,
        error: 'Template not found'
      });
    }

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

router.get('/:id/preview', async (req, res) => {
  try {
    const template = templateManager.getTemplate(req.params.id);
    
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        error: 'Template not found' 
      });
    }
    
    const previewPath = templateManager.getPreviewPath(req.params.id);
    
    try {
      await fs.access(previewPath);
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.sendFile(previewPath);
    } catch {
      res.status(404).json({ 
        success: false, 
        error: 'Preview image not found' 
      });
    }
  } catch (error) {
    console.error(`Error in GET /templates/${req.params.id}/preview:`, error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to get preview' 
    });
  }
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
