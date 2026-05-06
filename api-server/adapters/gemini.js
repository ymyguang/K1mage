import { GoogleGenAI, Modality } from '@google/genai';
import { BaseAdapter } from './base.js';

export class GeminiAdapter extends BaseAdapter {
  constructor(providerConfig) {
    super(providerConfig);
    this.client = null;
  }

  getClient() {
    if (!this.client) {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
    return this.client;
  }

  async generateImage(request) {
    const startTime = Date.now();
    
    try {
      const modelConfig = this.validateRequest(request);
      const client = this.getClient();
      
      const config = {
        responseModalities: [Modality.IMAGE],
      };
      
      if (request.aspectRatio) {
        config.imageConfig = {
          aspectRatio: request.aspectRatio
        };
      }
      
      const response = await client.models.generateContent({
        model: request.model,
        contents: { parts: [{ text: request.prompt }] },
        config,
      });
      
      const result = this.extractResponse(response);
      
      if (!result.imageUrl) {
        throw new Error(result.text || 'The model did not return an image.');
      }
      
      return this.createSuccessResponse(result.imageUrl, result.text, {
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
      const client = this.getClient();
      
      let fullPrompt = request.prompt;
      const parts = [];
      
      if (request.images && request.images.length > 0) {
        parts.push({
          inlineData: { 
            data: request.images[0].base64, 
            mimeType: request.images[0].mimeType 
          },
        });
      }
      
      if (request.mask) {
        parts.push({
          inlineData: { data: request.mask, mimeType: 'image/png' },
        });
        fullPrompt = `Apply the following instruction only to the masked area of the image: "${request.prompt}". Preserve the unmasked area.`;
      }
      
      if (request.images && request.images.length > 1) {
        request.images.slice(1).forEach(img => {
          parts.push({
            inlineData: { data: img.base64, mimeType: img.mimeType },
          });
        });
      }
      
      parts.push({ text: fullPrompt });
      
      const response = await client.models.generateContent({
        model: request.model,
        contents: { parts },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });
      
      const result = this.extractResponse(response);
      
      if (!result.imageUrl) {
        throw new Error(result.text || 'The model did not return an image.');
      }
      
      return this.createSuccessResponse(result.imageUrl, result.text, {
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

  extractResponse(response) {
    const result = { imageUrl: null, text: null };
    const responseParts = response.candidates?.[0]?.content?.parts;
    
    if (responseParts) {
      for (const part of responseParts) {
        if (part.text) {
          result.text = (result.text ? result.text + "\n" : "") + part.text;
        } else if (part.inlineData) {
          result.imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    if (!result.imageUrl) {
      const finishReason = response.candidates?.[0]?.finishReason;
      const safetyRatings = response.candidates?.[0]?.safetyRatings;
      
      if (finishReason === 'SAFETY') {
        const blockedCategories = safetyRatings?.filter(r => r.blocked).map(r => r.category).join(', ');
        result.text = `The request was blocked for safety reasons. Categories: ${blockedCategories || 'Unknown'}. Please modify your prompt or image.`;
      }
    }
    
    return result;
  }

  handleError(error, context) {
    if (error instanceof Error) {
      let errorMessage = error.message;
      
      try {
        const parsedError = JSON.parse(errorMessage);
        if (parsedError.error && parsedError.error.message) {
          if (parsedError.error.status === 'RESOURCE_EXHAUSTED') {
            errorMessage = "You've likely exceeded the request limit. Please wait a moment before trying again.";
          } else if (parsedError.error.code === 500 || parsedError.error.status === 'UNKNOWN') {
            errorMessage = "An unexpected server error occurred. This might be a temporary issue. Please try again in a few moments.";
          } else if (parsedError.error.code === 403 || parsedError.error.status === 'PERMISSION_DENIED') {
            errorMessage = "This model requires a paid API key. Please select a valid API key with billing enabled.";
          } else {
            errorMessage = parsedError.error.message;
          }
        }
      } catch (e) {
        if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED")) {
          errorMessage = "This model requires a paid API key. Please select a valid API key with billing enabled.";
        }
      }
      
      return new Error(errorMessage);
    }
    
    return new Error(`An unknown error occurred during ${context}.`);
  }
}
