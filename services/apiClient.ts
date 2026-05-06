const API_BASE_URL = import.meta.env.VITE_API_SERVER_URL || 'http://localhost:3001';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  async generateImage(params) {
    const { model, prompt, aspectRatio, quality, style, ...options } = params;
    
    return this.request('/api/image/generate', {
      method: 'POST',
      body: JSON.stringify({
        model,
        prompt,
        aspectRatio,
        quality,
        style,
        ...options
      }),
    });
  }

  async editImage(params) {
    const { model, prompt, images, mask, aspectRatio, ...options } = params;
    
    return this.request('/api/image/edit', {
      method: 'POST',
      body: JSON.stringify({
        model,
        prompt,
        images,
        mask,
        aspectRatio,
        ...options
      }),
    });
  }

  async getModels() {
    return this.request('/api/image/models');
  }

  async getProviders() {
    return this.request('/api/image/providers');
  }

  async healthCheck() {
    return this.request('/health');
  }
}

export const apiClient = new ApiClient();

export async function generateImage(prompt, model, options = {}) {
  return apiClient.generateImage({
    model,
    prompt,
    ...options
  });
}

export async function editImage(prompt, images, model, options = {}) {
  const { mask, ...otherOptions } = options;
  return apiClient.editImage({
    model,
    prompt,
    images,
    mask,
    ...otherOptions
  });
}

export async function getAvailableModels() {
  const response = await apiClient.getModels();
  return response.models || [];
}

export async function getEnabledProviders() {
  const response = await apiClient.getProviders();
  return response.providers || [];
}

export async function getDefaultModel(): Promise<string> {
  try {
    const response = await apiClient.request('/api/image/default-model');
    return response.model || 'gemini/gemini-2.5-flash-image';
  } catch (error) {
    console.error('Error fetching default model:', error);
    return 'gemini/gemini-2.5-flash-image';
  }
}

export async function getTemplates(options = {}) {
  const params = new URLSearchParams();
  Object.entries(options).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      params.append(key, String(value));
    }
  });
  const queryString = params.toString();
  const url = queryString ? `/api/templates?${queryString}` : '/api/templates';
  return apiClient.request(url);
}

export async function getTemplate(id) {
  return apiClient.request(`/api/templates/${id}`);
}

export async function getTemplatePreviewUrl(id) {
  return `${API_BASE_URL}/api/templates/${id}/preview`;
}

export async function generateImageByTemplate(templateId, model, options = {}) {
  return apiClient.request('/api/image/generate', {
    method: 'POST',
    body: JSON.stringify({
      templateId,
      model,
      ...options
    }),
  });
}

export async function generateVideo(prompt, image, aspectRatio, onProgress) {
  if (onProgress) {
    onProgress("Initializing video generation...");
  }
  
  throw new Error("Video generation is not yet supported in the unified API. Please use the legacy Gemini API.");
}
