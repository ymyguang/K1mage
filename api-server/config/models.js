export const MODEL_CONFIGS = {
  gemini: {
    name: 'Google Gemini',
    provider: 'gemini',
    models: [
      {
        id: 'gemini-2.5-flash-image',
        name: 'Gemini Flash',
        description: 'Fast image generation',
        badge: 'Fast'
      },
      {
        id: 'gemini-3-pro-image-preview',
        name: 'Gemini Pro',
        description: 'High quality image generation',
        badge: 'Pro'
      }
    ]
  },
  openai: {
    name: 'OpenAI',
    provider: 'openai',
    models: [
      {
        id: 'gpt-image-2',
        name: 'GPT Image 2',
        description: 'Latest GPT image generation model',
        badge: 'Latest'
      },
      {
        id: 'dall-e-3',
        name: 'DALL-E 3',
        description: 'Previous generation',
        badge: 'Classic'
      },
      {
        id: 'dall-e-2',
        name: 'DALL-E 2',
        description: 'Legacy model',
        badge: 'Legacy'
      }
    ]
  },
  tongyi: {
    name: '通义万相',
    provider: 'tongyi',
    models: [
      {
        id: 'wanx-v1',
        name: '通义万相 v1',
        description: '通义万相基础版',
        badge: '基础'
      },
      {
        id: 'wanx-v2.6',
        name: '通义万相 v2.6',
        description: '通义万相增强版',
        badge: '增强'
      }
    ]
  },
  dmfox: {
    name: 'DMFox',
    provider: 'dmfox',
    models: [
      {
        id: 'gpt-image-2',
        name: 'GPT Image 2',
        description: 'DMFox image generation service',
        badge: 'DMFox'
      }
    ]
  }
};

export function getAvailableModels() {
  const models = [];
  for (const [provider, config] of Object.entries(MODEL_CONFIGS)) {
    for (const model of config.models) {
      models.push({
        id: `${provider}/${model.id}`,
        name: model.name,
        provider: config.name,
        description: model.description,
        badge: model.badge
      });
    }
  }
  return models;
}
