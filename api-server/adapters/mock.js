import { BaseAdapter } from './base.js';

const MOCK_IMAGES = [
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xNkREaB4AAABYSURBVChTY/hPIGBgYGBg+M+ADxj9J0QDGFDAfzI0MjAwMPxHx4BMYMAYhsUM/xkYGBj+Y5PIAGli+I8mBtEEacQKyPA1QV5nwOtrgiJAhkYGCJrhP1EBgwD4WBcJ9sWlHQAAAABJRU5ErkJggg==',
];

export class MockAdapter extends BaseAdapter {
  constructor(providerConfig) {
    super(providerConfig);
    this.callCount = 0;
  }

  validateRequest(request) {
    if (!request.prompt || typeof request.prompt !== 'string' || request.prompt.trim() === '') {
      throw new Error('Prompt is required and must be a non-empty string');
    }
    return { id: request.model || 'mock-model', name: 'Mock Model' };
  }

  async generateImage(request) {
    const startTime = Date.now();
    
    try {
      this.validateRequest(request);
      
      this.callCount++;
      const imageUrl = MOCK_IMAGES[this.callCount % MOCK_IMAGES.length];
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return this.createSuccessResponse(
        imageUrl,
        `Mock generated image for: ${request.prompt}`,
        {
          model: request.model,
          processingTime: Date.now() - startTime,
          mock: true
        }
      );
    } catch (error) {
      return this.createErrorResponse(error, {
        processingTime: Date.now() - startTime
      });
    }
  }

  async editImage(request) {
    const startTime = Date.now();
    
    try {
      if (!request.prompt || typeof request.prompt !== 'string' || request.prompt.trim() === '') {
        throw new Error('Prompt is required and must be a non-empty string');
      }
      
      if (!request.images || !Array.isArray(request.images) || request.images.length === 0) {
        throw new Error('Images array is required and must not be empty');
      }
      
      this.callCount++;
      const imageUrl = MOCK_IMAGES[this.callCount % MOCK_IMAGES.length];
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return this.createSuccessResponse(
        imageUrl,
        `Mock edited image for: ${request.prompt}`,
        {
          model: request.model,
          processingTime: Date.now() - startTime,
          mock: true
        }
      );
    } catch (error) {
      return this.createErrorResponse(error, {
        processingTime: Date.now() - startTime
      });
    }
  }
}
