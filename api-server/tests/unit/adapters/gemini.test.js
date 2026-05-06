import { GeminiAdapter } from '../../../adapters/gemini.js';

describe('Gemini Adapter Unit Tests', () => {
  let adapter;
  const mockConfig = {
    name: 'Google Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com',
    apiKey: 'test-api-key',
    models: [
      {
        id: 'gemini-2.5-flash-image',
        name: 'Gemini Flash',
        maxImages: 4,
        supportsEditing: true,
        supportsAspectRatio: true
      }
    ]
  };

  beforeEach(() => {
    adapter = new GeminiAdapter(mockConfig);
  });

  it('should instantiate correctly', () => {
    expect(adapter).toBeDefined();
    expect(adapter.provider).toBe('Google Gemini');
  });

  it('should have required methods', () => {
    expect(typeof adapter.generateImage).toBe('function');
    expect(typeof adapter.editImage).toBe('function');
  });

  it('should validate request parameters', async () => {
    const result = await adapter.generateImage({});
    expect(result.success).toBe(false);
    expect(result.error).toContain('Prompt is required');
  });

  it('should validate model parameter', async () => {
    const result = await adapter.generateImage({ prompt: 'test' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Model is required');
  });

  it('should validate image request parameters', async () => {
    const result = await adapter.editImage({ prompt: 'test', model: 'gemini-2.5-flash-image' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Images array is required');
  });

  it('should create success response', () => {
    const response = adapter.createSuccessResponse('http://example.com/image.png', 'test text');
    expect(response.success).toBe(true);
    expect(response.imageUrl).toBe('http://example.com/image.png');
    expect(response.text).toBe('test text');
    expect(response.metadata.provider).toBe('Google Gemini');
  });

  it('should create error response', () => {
    const error = new Error('Test error');
    const response = adapter.createErrorResponse(error);
    expect(response.success).toBe(false);
    expect(response.error).toBe('Test error');
    expect(response.metadata.provider).toBe('Google Gemini');
  });

  it('should have correct provider config', () => {
    expect(adapter.provider).toBe('Google Gemini');
    expect(adapter.baseUrl).toBe('https://generativelanguage.googleapis.com');
    expect(adapter.apiKey).toBe('test-api-key');
    expect(Array.isArray(adapter.models)).toBe(true);
    expect(adapter.models.length).toBe(1);
  });

  it('should validate aspect ratio conversion', () => {
    expect(adapter.convertAspectRatio('1:1', ['1024x1024'])).toBe('1024x1024');
    expect(adapter.convertAspectRatio('16:9', ['1792x1024'])).toBe('1792x1024');
    expect(adapter.convertAspectRatio(undefined, ['1024x1024'])).toBe('1024x1024');
  });
});
