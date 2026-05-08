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
        description: 'GPT Image model supported by the configured OpenAI-compatible provider',
        badge: 'Provider'
      },
      {
        id: 'gpt-image-1.5',
        name: 'GPT Image 1.5',
        description: 'Latest GPT Image model for generation and editing',
        badge: 'Latest'
      },
      {
        id: 'gpt-image-1',
        name: 'GPT Image 1',
        description: 'GPT Image model for generation and editing',
        badge: 'GPT'
      },
      {
        id: 'gpt-image-1-mini',
        name: 'GPT Image 1 Mini',
        description: 'Lower-cost GPT Image model',
        badge: 'Mini'
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
