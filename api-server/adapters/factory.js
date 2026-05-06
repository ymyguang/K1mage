import { GeminiAdapter } from './gemini.js';
import { OpenAIAdapter } from './openai.js';
import { TongyiAdapter } from './tongyi.js';
import { MockAdapter } from './mock.js';
import { config } from '../config/index.js';

const isMockMode = process.env.ENABLE_MOCK === 'true';

class AdapterFactory {
  constructor() {
    this.adapters = new Map();
    this.adapterClasses = {
      gemini: GeminiAdapter,
      openai: OpenAIAdapter,
      tongyi: TongyiAdapter,
      dmfox: OpenAIAdapter
    };
  }

  getAdapter(provider) {
    if (isMockMode) {
      if (!this.adapters.has('mock-' + provider)) {
        const mockConfig = {
          name: `Mock ${provider}`,
          baseUrl: 'http://mock',
          apiKey: 'mock-key',
          models: [
            { id: 'mock-model', name: 'Mock Model', maxImages: 4, supportsEditing: true, supportsAspectRatio: true }
          ]
        };
        const adapter = new MockAdapter(mockConfig);
        this.adapters.set('mock-' + provider, adapter);
      }
      return this.adapters.get('mock-' + provider);
    }

    if (!this.adapters.has(provider)) {
      const providerConfig = config.getProvider(provider);
      
      if (!providerConfig) {
        throw new Error(`Unknown provider: ${provider}`);
      }
      
      if (!providerConfig.enabled) {
        throw new Error(`Provider ${provider} is not configured. Please set the API key.`);
      }
      
      const AdapterClass = this.adapterClasses[provider];
      if (!AdapterClass) {
        throw new Error(`No adapter implemented for provider: ${provider}`);
      }
      
      const adapter = new AdapterClass(providerConfig);
      this.adapters.set(provider, adapter);
    }
    
    return this.adapters.get(provider);
  }

  getAdapterForModel(modelId) {
    const [provider] = modelId.split('/');
    return this.getAdapter(provider);
  }

  getEnabledProviders() {
    if (isMockMode) {
      return {
        gemini: { name: 'Mock Gemini', enabled: true, models: [{ id: 'mock-model', name: 'Mock Model' }] },
        openai: { name: 'Mock OpenAI', enabled: true, models: [{ id: 'mock-model', name: 'Mock Model' }] },
        tongyi: { name: 'Mock Tongyi', enabled: true, models: [{ id: 'mock-model', name: 'Mock Model' }] }
      };
    }
    return config.getEnabledProviders();
  }

  isProviderEnabled(provider) {
    if (isMockMode) return true;
    return config.isProviderEnabled(provider);
  }
}

export const adapterFactory = new AdapterFactory();
