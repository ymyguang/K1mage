import { BaseAdapter } from './base.js';

export class TongyiAdapter extends BaseAdapter {
  constructor(providerConfig) {
    super(providerConfig);
  }

  async generateImage(request) {
    const startTime = Date.now();
    
    try {
      const modelConfig = this.validateRequest(request);
      
      const requestBody = {
        model: request.model,
        input: {
          prompt: request.prompt
        },
        parameters: {
          n: 1,
          size: this.convertAspectRatio(request.aspectRatio),
          style: request.style || '<auto>'
        }
      };
      
      const response = await fetch(`${this.baseUrl}/services/aigc/text2image/image-synthesis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-DashScope-Async': 'enable'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { response: { status: response.status, data: errorData } };
      }
      
      const data = await response.json();
      
      if (data.output && data.output.task_status === 'PENDING') {
        const result = await this.pollTaskResult(data.output.task_id);
        return this.createSuccessResponse(result, null, {
          model: request.model,
          processingTime: Date.now() - startTime
        });
      }
      
      if (data.output && data.output.results && data.output.results.length > 0) {
        const imageUrl = data.output.results[0].url;
        return this.createSuccessResponse(imageUrl, null, {
          model: request.model,
          processingTime: Date.now() - startTime
        });
      }
      
      throw new Error('No image was generated');
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
      
      const requestBody = {
        model: request.model,
        input: {
          prompt: request.prompt,
          base_image_url: `data:${request.images[0].mimeType};base64,${request.images[0].base64}`
        },
        parameters: {
          n: 1,
          size: this.convertAspectRatio(request.aspectRatio)
        }
      };
      
      const response = await fetch(`${this.baseUrl}/services/aigc/image2image/image-synthesis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'X-DashScope-Async': 'enable'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { response: { status: response.status, data: errorData } };
      }
      
      const data = await response.json();
      
      if (data.output && data.output.task_status === 'PENDING') {
        const result = await this.pollTaskResult(data.output.task_id);
        return this.createSuccessResponse(result, null, {
          model: request.model,
          processingTime: Date.now() - startTime
        });
      }
      
      if (data.output && data.output.results && data.output.results.length > 0) {
        const imageUrl = data.output.results[0].url;
        return this.createSuccessResponse(imageUrl, null, {
          model: request.model,
          processingTime: Date.now() - startTime
        });
      }
      
      throw new Error('No image was generated');
    } catch (error) {
      return this.createErrorResponse(
        this.handleError(error, 'editImage'),
        { processingTime: Date.now() - startTime }
      );
    }
  }

  async pollTaskResult(taskId, maxAttempts = 30, interval = 2000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, interval));
      
      const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch task status');
      }
      
      const data = await response.json();
      
      if (data.output && data.output.task_status === 'SUCCEEDED') {
        if (data.output.results && data.output.results.length > 0) {
          return data.output.results[0].url;
        }
        throw new Error('Task succeeded but no image was generated');
      }
      
      if (data.output && data.output.task_status === 'FAILED') {
        throw new Error(data.output.message || 'Task failed');
      }
    }
    
    throw new Error('Task timed out');
  }

  convertAspectRatio(aspectRatio) {
    const ratioMap = {
      '1:1': '1024*1024',
      '16:9': '1024*576',
      '9:16': '576*1024',
      '4:3': '1024*768',
      '3:4': '768*1024'
    };
    
    return ratioMap[aspectRatio] || '1024*1024';
  }

  handleError(error, context) {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      if (status === 401) {
        return new Error('Invalid API key. Please check your Tongyi API key.');
      }
      
      if (status === 429) {
        return new Error('Rate limit exceeded. Please try again later.');
      }
      
      if (data && data.code) {
        return new Error(`Tongyi error: ${data.message || data.code}`);
      }
    }
    
    return super.handleError(error, context);
  }
}
