import { BaseAdapter } from './base.js';
import fetch from 'node-fetch';
import { AbortController } from 'abort-controller';

export class OpenAIAdapter extends BaseAdapter {
  constructor(providerConfig) {
    super(providerConfig);
  }

  async generateImage(request) {
    const startTime = Date.now();
    
    try {
      const modelConfig = this.validateRequest(request);
      
      const requestBody = {
        model: request.model,
        prompt: request.prompt,
        n: 1,
        size: this.convertAspectRatio(request.aspectRatio, modelConfig.aspectRatios || ['1024x1024']),
      };
      
      if (request.model === 'dall-e-3') {
        requestBody.quality = request.quality || 'standard';
        requestBody.style = request.style || 'vivid';
        requestBody.response_format = 'b64_json';
      } else if (request.model === 'gpt-image-2') {
        requestBody.quality = request.quality || 'auto';
        if (request.background) {
          requestBody.background = request.background;
        }
        if (request.output_format) {
          requestBody.output_format = request.output_format;
        }
        if (request.output_compression) {
          requestBody.output_compression = request.output_compression;
        }
      } else {
        requestBody.response_format = 'b64_json';
      }
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180000); // 3分钟超时
      
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { response: { status: response.status, data: errorData } };
      }
      
      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No image was generated');
      }
      
      const imageData = data.data[0];
      let imageUrl;
      
      if (imageData.b64_json) {
        imageUrl = `data:image/png;base64,${imageData.b64_json}`;
      } else if (imageData.url) {
        imageUrl = imageData.url;
      } else {
        throw new Error('No image data in response');
      }
      
      return this.createSuccessResponse(imageUrl, imageData.revised_prompt || null, {
        model: request.model,
        processingTime: Date.now() - startTime
      });
    } catch (error) {
      return this.createErrorResponse(
        this.handleError(error, 'generateImage'),
        { processingTime: Date.now() - startTime }
      );
    }
  }

  async editImage(request) {
    const startTime = Date.now();
    
    try {
      this.validateImageRequest(request);
      
      const modelConfig = this.models.find(m => m.id === request.model);
      if (modelConfig && !modelConfig.supportsEditing) {
        throw new Error(`Model ${request.model} does not support image editing`);
      }
      
      const formData = new FormData();
      formData.append('model', request.model);
      formData.append('prompt', request.prompt);
      formData.append('n', '1');
      formData.append('size', this.convertAspectRatio(request.aspectRatio, ['256x256', '512x512', '1024x1024']));
      
      if (request.model !== 'gpt-image-2') {
        formData.append('response_format', 'b64_json');
      }
      
      const imageBlob = this.base64ToBlob(request.images[0].base64, request.images[0].mimeType);
      formData.append('image', imageBlob, 'image.png');
      
      if (request.mask) {
        const maskBlob = this.base64ToBlob(request.mask, 'image/png');
        formData.append('mask', maskBlob, 'mask.png');
      }
      
      const response = await fetch(`${this.baseUrl}/images/edits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { response: { status: response.status, data: errorData } };
      }
      
      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error('No image was generated');
      }
      
      const imageData = data.data[0];
      let imageUrl;
      
      if (imageData.b64_json) {
        imageUrl = `data:image/png;base64,${imageData.b64_json}`;
      } else if (imageData.url) {
        imageUrl = imageData.url;
      } else {
        throw new Error('No image data in response');
      }
      
      return this.createSuccessResponse(imageUrl, null, {
        model: request.model,
        processingTime: Date.now() - startTime
      });
    } catch (error) {
      return this.createErrorResponse(
        this.handleError(error, 'editImage'),
        { processingTime: Date.now() - startTime }
      );
    }
  }

  base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  convertAspectRatio(aspectRatio, supportedRatios) {
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
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        return new Error('Invalid API key. Please check your OpenAI API key.');
      }
      
      if (status === 429) {
        return new Error('Rate limit exceeded. Please try again later.');
      }
      
      if (data && data.error) {
        return new Error(`OpenAI error: ${data.error.message}`);
      }
    }
    
    return super.handleError(error, context);
  }
}
