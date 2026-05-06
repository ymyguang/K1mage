import express from 'express';
import { templateManager } from '../template-manager.js';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

router.get('/', (req, res) => {
  try {
    const { sort, featured, tags } = req.query;
    const templates = templateManager.getTemplates({ sort, featured, tags });
    
    const templatesList = templates.map(t => ({
      id: t.id,
      name: t.name,
      name_en: t.name_en,
      description: t.description,
      description_en: t.description_en,
      emoji: t.emoji,
      order: t.order,
      click_count: t.click_count,
      is_featured: t.is_featured,
      max_images: t.max_images,
      is_custom: t.is_custom,
      tags: t.tags,
      preview_url: t.preview_url
    }));
    
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
      template: {
        id: template.id,
        name: template.name,
        name_en: template.name_en,
        description: template.description,
        description_en: template.description_en,
        emoji: template.emoji,
        order: template.order,
        click_count: template.click_count,
        is_featured: template.is_featured,
        max_images: template.max_images,
        is_custom: template.is_custom,
        tags: template.tags,
        preview_url: template.preview_url
      }
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
