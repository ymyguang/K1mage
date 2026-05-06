import dotenv from 'dotenv';
import { PROVIDER_CONFIGS } from './providers.js';
import { MODEL_CONFIGS, getAvailableModels } from './models.js';

dotenv.config();

class ConfigManager {
  constructor() {
    this.providers = PROVIDER_CONFIGS;
    this.models = MODEL_CONFIGS;
    this.validate();
  }

  validate() {
    const enabledProviders = [];
    for (const [provider, config] of Object.entries(this.providers)) {
      if (config.enabled) {
        enabledProviders.push(provider);
      } else {
        console.warn(`Warning: ${provider} API key not configured, provider disabled`);
      }
    }
    
    if (enabledProviders.length === 0) {
      console.error('Error: No providers configured. Please set at least one API key.');
    } else {
      console.log(`Enabled providers: ${enabledProviders.join(', ')}`);
    }
  }

  getProvider(name) {
    return this.providers[name];
  }

  getEnabledProviders() {
    const enabled = {};
    for (const [name, config] of Object.entries(this.providers)) {
      if (config.enabled) {
        enabled[name] = config;
      }
    }
    return enabled;
  }

  getModel(modelId) {
    const [provider, modelName] = modelId.split('/');
    const providerConfig = this.providers[provider];
    if (!providerConfig) {
      throw new Error(`Unknown provider: ${provider}`);
    }
    
    if (!providerConfig.enabled) {
      throw new Error(`Provider ${provider} is not configured`);
    }
    
    const modelConfig = providerConfig.models.find(m => m.id === modelName);
    if (!modelConfig) {
      throw new Error(`Unknown model: ${modelName} for provider ${provider}`);
    }
    
    return { provider: providerConfig, model: modelConfig };
  }

  getDefaultModel() {
    const defaultProvider = process.env.DEFAULT_PROVIDER || 'gemini';
    const defaultModel = process.env.DEFAULT_MODEL || 'gemini-2.5-flash-image';
    return `${defaultProvider}/${defaultModel}`;
  }

  getAllModels() {
    return getAvailableModels();
  }

  isProviderEnabled(provider) {
    return this.providers[provider]?.enabled || false;
  }
}

export const config = new ConfigManager();
