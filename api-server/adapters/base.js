export class BaseAdapter {
  constructor(providerConfig) {
    this.provider = providerConfig.name;
    this.baseUrl = providerConfig.baseUrl;
    this.apiKey = providerConfig.apiKey;
    this.models = providerConfig.models;
  }

  async generateImage(request) {
    throw new Error('generateImage method not implemented');
  }

  async editImage(request) {
    throw new Error('editImage method not implemented');
  }

  validateRequest(request) {
    if (!request.prompt || typeof request.prompt !== 'string' || request.prompt.trim() === '') {
      throw new Error('Prompt is required and must be a non-empty string');
    }
    
    if (!request.model) {
      throw new Error('Model is required');
    }
    
    const modelConfig = this.models.find(m => m.id === request.model);
    if (!modelConfig) {
      throw new Error(`Model ${request.model} is not available for provider ${this.provider}`);
    }
    
    return modelConfig;
  }

  validateImageRequest(request) {
    this.validateRequest(request);
    
    if (!request.images || !Array.isArray(request.images) || request.images.length === 0) {
      throw new Error('Images array is required and must not be empty');
    }
    
    for (const image of request.images) {
      if (!image.base64 || !image.mimeType) {
        throw new Error('Each image must have base64 and mimeType properties');
      }
    }
  }

  convertAspectRatio(aspectRatio, supportedRatios) {
    if (!aspectRatio) return supportedRatios[0];
    
    const ratioMap = {
      '1:1': '1024x1024',
      '16:9': '1792x1024',
      '9:16': '1024x1792',
      '4:3': '1024x768',
      '3:4': '768x1024'
    };
    
    const converted = ratioMap[aspectRatio];
    if (converted && supportedRatios.includes(converted)) {
      return converted;
    }
    
    return supportedRatios[0];
  }

  handleError(error, context) {
    console.error(`Error in ${this.provider} adapter (${context}):`, error);
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401 || status === 403) {
        throw new Error(`Authentication failed for ${this.provider}. Please check your API key.`);
      }
      
      if (status === 429) {
        throw new Error(`Rate limit exceeded for ${this.provider}. Please try again later.`);
      }
      
      if (data && data.error) {
        throw new Error(`${this.provider} error: ${data.error.message || data.error}`);
      }
    }
    
    if (error.message) {
      throw new Error(`${this.provider} error: ${error.message}`);
    }
    
    throw new Error(`Unknown error occurred in ${this.provider} adapter`);
  }

  createSuccessResponse(imageUrl, text = null, metadata = {}) {
    return {
      success: true,
      imageUrl,
      text,
      metadata: {
        provider: this.provider,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  createErrorResponse(error, metadata = {}) {
    return {
      success: false,
      error: error.message || error,
      metadata: {
        provider: this.provider,
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }
}
