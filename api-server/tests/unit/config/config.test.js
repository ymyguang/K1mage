import { config } from '../../../config/index.js';

describe('Config Manager Unit Tests', () => {
  it('should load configuration', () => {
    expect(config).toBeDefined();
    expect(config.providers).toBeDefined();
    expect(config.models).toBeDefined();
  });

  it('should have provider configurations', () => {
    expect(config.providers.gemini).toBeDefined();
    expect(config.providers.openai).toBeDefined();
    expect(config.providers.tongyi).toBeDefined();
  });

  it('should get provider by name', () => {
    const geminiProvider = config.getProvider('gemini');
    expect(geminiProvider).toBeDefined();
    expect(geminiProvider.name).toBe('Google Gemini');
  });

  it('should return undefined for unknown provider', () => {
    const provider = config.getProvider('unknown');
    expect(provider).toBeUndefined();
  });

  it('should get all models', () => {
    const models = config.getAllModels();
    expect(Array.isArray(models)).toBe(true);
    expect(models.length).toBeGreaterThan(0);
  });

  it('should get default model', () => {
    const defaultModel = config.getDefaultModel();
    expect(defaultModel).toBeDefined();
    expect(typeof defaultModel).toBe('string');
    expect(defaultModel).toContain('/');
  });

  it('should check if provider is enabled', () => {
    expect(typeof config.isProviderEnabled('gemini')).toBe('boolean');
  });

  it('should get enabled providers', () => {
    const enabledProviders = config.getEnabledProviders();
    expect(typeof enabledProviders).toBe('object');
  });

  it('should have correct provider structure', () => {
    const geminiProvider = config.getProvider('gemini');
    expect(geminiProvider).toHaveProperty('name');
    expect(geminiProvider).toHaveProperty('baseUrl');
    expect(geminiProvider).toHaveProperty('apiKey');
    expect(geminiProvider).toHaveProperty('enabled');
    expect(geminiProvider).toHaveProperty('models');
    expect(Array.isArray(geminiProvider.models)).toBe(true);
  });

  it('should have correct model structure', () => {
    const geminiProvider = config.getProvider('gemini');
    const model = geminiProvider.models[0];
    expect(model).toHaveProperty('id');
    expect(model).toHaveProperty('name');
    expect(model).toHaveProperty('maxImages');
    expect(model).toHaveProperty('supportsEditing');
    expect(model).toHaveProperty('supportsAspectRatio');
  });
});
