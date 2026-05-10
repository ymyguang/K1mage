import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TemplateManager {
  constructor() {
    this.promptsDir = path.join(__dirname, 'prompts');
    this.templates = new Map();
    this.loaded = false;
  }

  async loadAll() {
    try {
      const entries = await fs.readdir(this.promptsDir, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const templateId = entry.name;
        const templateDir = path.join(this.promptsDir, templateId);
        
        try {
          const metaPath = path.join(templateDir, 'meta.json');
          const promptPath = path.join(templateDir, 'prompt.txt');
          const pricePath = path.join(templateDir, 'price.json');
          
          const [metaContent, promptContent] = await Promise.all([
            fs.readFile(metaPath, 'utf-8'),
            fs.readFile(promptPath, 'utf-8')
          ]);
          
          const meta = JSON.parse(metaContent);
          const prompt = promptContent.trim();
          const price = await this.readJsonIfExists(pricePath, {
            price_per_image: 0,
            currency: 'CNY'
          });
          const previewVersion = await this.getPreviewVersion(templateId);
          const coverVersion = await this.getCoverVersion(templateId);
          
          const template = {
            ...meta,
            id: templateId,
            prompt,
            price,
            preview_version: previewVersion,
            preview_url: `/api/templates/${templateId}/preview?v=${previewVersion}`,
            cover_version: coverVersion,
            cover_url: coverVersion ? `/api/templates/${templateId}/cover?v=${coverVersion}` : null
          };
          
          this.templates.set(templateId, template);
        } catch (err) {
          console.warn(`Failed to load template ${templateId}:`, err.message);
        }
      }
      
      this.loaded = true;
      console.log(`Loaded ${this.templates.size} templates`);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  }

  async readJsonIfExists(filePath, fallback) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.warn(`Failed to load JSON ${filePath}:`, err.message);
      }
      return fallback;
    }
  }

  async getPreviewVersion(id) {
    try {
      const stat = await fs.stat(this.getPreviewPath(id));
      return Math.round(stat.mtimeMs);
    } catch {
      return Date.now();
    }
  }

  async getCoverVersion(id) {
    try {
      const stat = await fs.stat(this.getCoverPath(id));
      return Math.round(stat.mtimeMs);
    } catch {
      return null;
    }
  }

  getTemplates(options = {}) {
    const { sort = 'order', featured, tags, active_only = true } = options;
    
    let templates = Array.from(this.templates.values());
    
    if (active_only) {
      templates = templates.filter(t => t.is_active);
    }
    
    if (featured !== undefined) {
      templates = templates.filter(t => t.is_featured === (featured === 'true'));
    }
    
    if (tags) {
      const tagList = tags.split(',').map(t => t.trim());
      templates = templates.filter(t => 
        t.tags && t.tags.some(tag => tagList.includes(tag))
      );
    }
    
    if (sort === 'order') {
      templates.sort((a, b) => (b.order || 0) - (a.order || 0));
    } else if (sort === 'clicks') {
      templates.sort((a, b) => (b.click_count || 0) - (a.click_count || 0));
    } else if (sort === 'newest') {
      templates.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
    }
    
    return templates;
  }

  getTemplate(id) {
    return this.templates.get(id) || null;
  }

  getPrompt(id) {
    const template = this.templates.get(id);
    return template?.prompt || null;
  }

  getPreviewPath(id) {
    return path.join(this.promptsDir, id, 'preview.png');
  }

  getCoverPath(id) {
    return path.join(this.promptsDir, id, 'cover.png');
  }

  async incrementClickCount(id) {
    const template = this.templates.get(id);
    if (template) {
      template.click_count = (template.click_count || 0) + 1;
      
      try {
        const metaPath = path.join(this.promptsDir, id, 'meta.json');
        const meta = { ...template };
        delete meta.prompt;
        delete meta.preview_url;
        delete meta.preview_version;
        delete meta.cover_url;
        delete meta.cover_version;
        delete meta.price;
        await fs.writeFile(metaPath, JSON.stringify(meta, null, 2));
      } catch (err) {
        console.warn(`Failed to update click count for ${id}:`, err.message);
      }
    }
  }

  async reload() {
    this.templates.clear();
    this.loaded = false;
    await this.loadAll();
  }
}

export const templateManager = new TemplateManager();
