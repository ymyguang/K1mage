import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient, generateImage, editImage, getAvailableModels } from '../services/apiClient';

vi.stubGlobal('fetch', vi.fn());

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct base URL', () => {
    expect(apiClient.baseUrl).toBeDefined();
  });

  it('should have required methods', () => {
    expect(typeof apiClient.generateImage).toBe('function');
    expect(typeof apiClient.editImage).toBe('function');
    expect(typeof apiClient.getModels).toBe('function');
    expect(typeof apiClient.getProviders).toBe('function');
  });

  it('should call generateImage endpoint', async () => {
    const mockResponse = { success: true, imageUrl: 'test-url' };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await generateImage('test prompt', 'gemini/gemini-2.5-flash-image');
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/image/generate'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('should call editImage endpoint', async () => {
    const mockResponse = { success: true, imageUrl: 'test-url' };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const images = [{ base64: 'test-base64', mimeType: 'image/png' }];
    const result = await editImage('test prompt', images, 'gemini/gemini-2.5-flash-image');
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/image/edit'),
      expect.objectContaining({
        method: 'POST',
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('should handle API errors', async () => {
    const mockError = { error: 'Test error' };
    fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve(mockError),
    });

    await expect(generateImage('test', 'gemini/gemini-2.5-flash-image'))
      .rejects.toThrow('Test error');
  });

  it('should handle network errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    await expect(generateImage('test', 'gemini/gemini-2.5-flash-image'))
      .rejects.toThrow('Network error');
  });
});
