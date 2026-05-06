import dotenv from 'dotenv';
dotenv.config();

export const PROVIDER_CONFIGS = {
  gemini: {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    apiKey: process.env.GEMINI_API_KEY,
    enabled: !!process.env.GEMINI_API_KEY,
    models: [
      {
        id: 'gemini-2.5-flash-image',
        name: 'Gemini Flash',
        maxImages: 4,
        supportsEditing: true,
        supportsAspectRatio: true
      },
      {
        id: 'gemini-3-pro-image-preview',
        name: 'Gemini Pro',
        maxImages: 4,
        supportsEditing: true,
        supportsAspectRatio: true
      }
    ]
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    enabled: !!process.env.OPENAI_API_KEY,
    models: [
      {
        id: 'gpt-image-2',
        name: 'GPT Image 2',
        maxImages: 1,
        supportsEditing: true,
        supportsAspectRatio: true,
        aspectRatios: ['1024x1024', '1536x1024', '1024x1536', 'auto']
      },
      {
        id: 'dall-e-3',
        name: 'DALL-E 3',
        maxImages: 1,
        supportsEditing: false,
        supportsAspectRatio: true,
        aspectRatios: ['1024x1024', '1792x1024', '1024x1792']
      },
      {
        id: 'dall-e-2',
        name: 'DALL-E 2',
        maxImages: 1,
        supportsEditing: true,
        supportsAspectRatio: true,
        aspectRatios: ['256x256', '512x512', '1024x1024']
      }
    ]
  },
  tongyi: {
    name: '通义万相',
    baseUrl: 'https://dashscope.aliyuncs.com/api/v1',
    apiKey: process.env.TONGYI_API_KEY,
    enabled: !!process.env.TONGYI_API_KEY,
    models: [
      {
        id: 'wanx-v1',
        name: '通义万相 v1',
        maxImages: 1,
        supportsEditing: false,
        supportsAspectRatio: true
      },
      {
        id: 'wanx-v2.6',
        name: '通义万相 v2.6',
        maxImages: 1,
        supportsEditing: true,
        supportsAspectRatio: true
      }
    ]
  },
  dmfox: {
    name: 'DMFox',
    baseUrl: 'https://dm-fox.rjj.cc/codex/v1',
    apiKey: process.env.DMFOX_API_KEY,
    enabled: !!process.env.DMFOX_API_KEY,
    models: [
      {
        id: 'gpt-image-2',
        name: 'GPT Image 2',
        maxImages: 1,
        supportsEditing: true,
        supportsAspectRatio: true,
        aspectRatios: ['1024x1024', '1536x1024', '1024x1536', 'auto']
      }
    ]
  }
};
