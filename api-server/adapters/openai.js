import { BaseAdapter } from './base.js';
import fetch from 'node-fetch';
import { AbortController } from 'abort-controller';

const GPT_IMAGE_MODELS = new Set(['gpt-image-2', 'gpt-image-1.5', 'gpt-image-1', 'gpt-image-1-mini']);
const DEFAULT_RESPONSES_MODEL = 'gpt-5.4';
const RESPONSES_IMAGE_MODELS = ['gpt-5.2'];

export class OpenAIAdapter extends BaseAdapter {
  constructor(providerConfig) {
    super(providerConfig);
  }

  async generateImage(request) {
    const startTime = Date.now();

    try {
      const data = await this.withGptImageFallback(request, (nextRequest) => this.requestImageGeneration(nextRequest));
      const image = this.extractImage(data);

      return this.createSuccessResponse(image.url, image.text, {
        model: image.model || request.model,
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
      const data = request.useResponsesApi
        ? await this.requestResponsesImage(request)
        : await this.withGptImageFallback(request, (nextRequest) => this.requestImageEdit(nextRequest));
      const image = this.extractImage(data);

      return this.createSuccessResponse(image.url, image.text, {
        model: image.model || request.model,
        processingTime: Date.now() - startTime
      });
    } catch (error) {
      return this.createErrorResponse(
        this.handleError(error, 'editImage'),
        { processingTime: Date.now() - startTime }
      );
    }
  }

  async requestImageGeneration(request) {
    const modelConfig = this.validateRequest(request);
    const requestBody = {
      model: request.model,
      prompt: request.prompt,
      n: 1,
      size: this.convertAspectRatio(request.aspectRatio, modelConfig.aspectRatios || ['1024x1024'])
    };

    if (request.model === 'dall-e-3') {
      requestBody.quality = request.quality || 'standard';
      requestBody.style = request.style || 'vivid';
      requestBody.response_format = 'b64_json';
    } else if (GPT_IMAGE_MODELS.has(request.model)) {
      requestBody.quality = request.quality || 'auto';
      requestBody.output_format = request.output_format || 'png';
      requestBody.output_compression = request.output_compression ?? 100;
      requestBody.background = request.background || 'auto';
    } else {
      requestBody.response_format = 'b64_json';
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000);

    try {
      const response = await fetch(`${this.baseUrl}/images/generations`, {
        method: 'POST',
        headers: this.jsonHeaders(),
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      return await this.parseImageResponse(response);
    } finally {
      clearTimeout(timeout);
    }
  }

  async requestImageEdit(request) {
    this.validateImageRequest(request);

    const modelConfig = this.models.find(m => m.id === request.model);
    if (modelConfig && !modelConfig.supportsEditing) {
      throw new Error(`Model ${request.model} does not support image editing`);
    }

    const formData = new FormData();
    formData.append('model', request.model);
    formData.append('prompt', request.prompt);
    formData.append('n', '1');
    formData.append('size', this.resolveEditSize(request, modelConfig));

    if (GPT_IMAGE_MODELS.has(request.model)) {
      formData.append('quality', request.quality || 'auto');
      formData.append('output_format', request.output_format || 'png');
      formData.append('output_compression', String(request.output_compression ?? 100));
      formData.append('background', request.background || 'auto');
      formData.append('input_fidelity', request.input_fidelity || 'low');
    } else {
      formData.append('response_format', 'b64_json');
    }

    request.images.forEach((image, index) => {
      const imageBlob = this.base64ToBlob(image.base64, image.mimeType);
      formData.append('image', imageBlob, `image-${index}.jpg`);
    });

    if (request.mask) {
      const maskBlob = this.base64ToBlob(request.mask, 'image/png');
      formData.append('mask', maskBlob, 'mask.png');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180000);

    try {
      const response = await fetch(`${this.baseUrl}/images/edits`, {
        method: 'POST',
        headers: this.formHeaders(),
        body: formData,
        signal: controller.signal
      });

      return await this.parseImageResponse(response);
    } finally {
      clearTimeout(timeout);
    }
  }

  async withGptImageFallback(request, call) {
    try {
      return await call(request);
    } catch (error) {
      const shouldFallback = request.model === 'gpt-image-2' && error.response && error.response.status >= 500;
      if (!shouldFallback || !this.models.some(m => m.id === 'gpt-image-1')) {
        if (this.shouldTryResponsesApi(error)) {
          console.warn('Images API failed upstream; retrying with Responses API image_generation tool');
          return await this.requestResponsesImage(request);
        }
        throw error;
      }

      console.warn('gpt-image-2 request failed upstream; retrying with gpt-image-1');
      try {
        return await call({ ...request, model: 'gpt-image-1' });
      } catch (fallbackError) {
        if (this.shouldTryResponsesApi(fallbackError)) {
          console.warn('Images API fallback failed upstream; retrying with Responses API image_generation tool');
          return await this.requestResponsesImage({ ...request, model: 'gpt-image-1' });
        }
        throw fallbackError;
      }
    }
  }

  shouldTryResponsesApi(error) {
    return process.env.OPENAI_ENABLE_RESPONSES_FALLBACK === 'true'
      && Boolean(error.response && error.response.status >= 500);
  }

  async requestResponsesImage(request) {
    const attempts = this.createResponsesAttempts(request);

    let lastData = null;
    const attemptErrors = [];
    for (const body of attempts) {
      const response = await fetch(`${this.baseUrl}/responses`, {
        method: 'POST',
        headers: this.jsonHeaders(),
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        attemptErrors.push(this.extractErrorMessage(errorData) || `status ${response.status}`);
        continue;
      }

      const data = await this.parseJsonOrSse(response);
      lastData = data;
      const imageResult = this.findImageGenerationResult(data);
      if (imageResult) {
        return {
          data: [
            {
              b64_json: imageResult,
              model: body.model
            }
          ]
        };
      }
    }

    const outputTypes = Array.isArray(lastData?.output)
      ? lastData.output.map(item => item.type || item.role || 'unknown').join(', ')
      : 'none';
    const firstText = this.findFirstTextOutput(lastData);
    if (this.looksLikePseudoImageToolCall(firstText)) {
      throw new Error(
        'The configured OpenAI-compatible provider returned a text-only pseudo image tool call instead of a real image_generation_call result. ' +
        'This key/group does not appear to support GPT image generation through the Images API or Responses image_generation tool.'
      );
    }

    const extra = firstText ? ` First text output: ${firstText.slice(0, 240)}` : '';
    const errors = attemptErrors.length ? ` Attempt errors: ${attemptErrors.join(' | ')}` : '';
    throw new Error(`Responses API did not return an image_generation_call result. Output types: ${outputTypes || 'empty'}.${extra}${errors}`);
  }

  createResponsesAttempts(request) {
    const hasImages = Array.isArray(request.images) && request.images.length > 0;
    const attempts = [];
    const configuredModel = process.env.OPENAI_RESPONSES_MODEL || DEFAULT_RESPONSES_MODEL;
    const responsesModels = [
      configuredModel,
      ...RESPONSES_IMAGE_MODELS.filter(model => model !== configuredModel)
    ];

    for (const responsesModel of responsesModels) {
      if (hasImages) {
        attempts.push(this.createResponsesBody(request, {
          responsesModel,
          includeImages: true,
          includeToolOptions: false,
          forceTool: true
        }));
        attempts.push(this.createResponsesBody(request, {
          responsesModel,
          includeImages: true,
          includeToolOptions: true,
          forceTool: true
        }));
        attempts.push(this.createResponsesBody(request, {
          responsesModel,
          includeImages: true,
          includeToolOptions: false,
          forceTool: false
        }));
        attempts.push(this.createResponsesBody(request, {
          responsesModel,
          includeImages: true,
          includeToolOptions: true,
          forceTool: false
        }));
      }

      attempts.push(this.createResponsesBody(request, {
        responsesModel,
        includeImages: false,
        includeToolOptions: false,
        forceTool: true
      }));

      attempts.push(this.createResponsesBody(request, {
        responsesModel,
        includeImages: false,
        includeToolOptions: true,
        forceTool: true
      }));

      attempts.push(this.createResponsesBody(request, {
        responsesModel,
        includeImages: false,
        includeToolOptions: false,
        forceTool: false
      }));

      attempts.push(this.createResponsesBody(request, {
        responsesModel,
        includeImages: false,
        includeToolOptions: true,
        forceTool: false
      }));
    }

    return attempts;
  }

  createResponsesBody(request, { responsesModel, includeImages, includeToolOptions, forceTool }) {
    const hasImages = includeImages && Array.isArray(request.images) && request.images.length > 0;
    const prompt = hasImages
      ? `Use the attached input image(s) as visual references and create the final edited image. Do not answer with text or JSON.\n\nUser request:\n${request.prompt}`
      : `Create one image. Do not answer with text, markdown, or JSON. Use the image_generation tool to produce the image.\n\nUser request:\n${request.prompt}`;
    const tool = { type: 'image_generation' };

    if (includeToolOptions) {
      const modelConfig = this.models.find(m => m.id === request.model);
      tool.size = this.convertAspectRatio(request.aspectRatio, modelConfig?.aspectRatios || ['1024x1024']);
      tool.quality = request.quality || 'auto';
      tool.background = request.background || 'auto';
      tool.output_format = request.output_format || 'png';
      tool.output_compression = request.output_compression ?? 100;
      tool.action = hasImages ? 'edit' : 'generate';
    }

    const body = {
      model: responsesModel,
      instructions: 'You are not a text assistant. You are an image generation orchestrator. The only valid successful response is an image_generation_call result. Never output JSON arguments as text.',
      input: hasImages
        ? [
            {
              role: 'user',
              content: [
                { type: 'input_text', text: prompt },
                ...request.images.map(image => ({
                  type: 'input_image',
                  image_url: `data:${image.mimeType};base64,${image.base64}`
                }))
              ]
            }
          ]
        : [
            {
              role: 'user',
              content: [
                { type: 'input_text', text: prompt }
              ]
            }
          ],
      tools: [tool],
      stream: false
    };

    if (forceTool) {
      body.tool_choice = { type: 'image_generation' };
    }

    return body;
  }

  findImageGenerationResult(value) {
    if (!value || typeof value !== 'object') {
      return null;
    }

    if (value.type === 'image_generation_call' && typeof value.result === 'string') {
      return value.result;
    }

    if (typeof value.b64_json === 'string') {
      return value.b64_json;
    }

    if (typeof value.image_base64 === 'string') {
      return value.image_base64;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = this.findImageGenerationResult(item);
        if (result) {
          return result;
        }
      }
      return null;
    }

    for (const nested of Object.values(value)) {
      const result = this.findImageGenerationResult(nested);
      if (result) {
        return result;
      }
    }

    return null;
  }

  findFirstTextOutput(value) {
    if (!value || typeof value !== 'object') {
      return null;
    }

    if (typeof value.text === 'string') {
      return value.text;
    }

    if (typeof value.output_text === 'string') {
      return value.output_text;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = this.findFirstTextOutput(item);
        if (result) {
          return result;
        }
      }
      return null;
    }

    for (const nested of Object.values(value)) {
      const result = this.findFirstTextOutput(nested);
      if (result) {
        return result;
      }
    }

    return null;
  }

  looksLikePseudoImageToolCall(text) {
    if (typeof text !== 'string') {
      return false;
    }

    return text.includes('<ImageGenerationToolCall>')
      || text.includes('to=image_generation')
      || text.includes('"prompt"') && text.includes('"size"') && text.includes('"n"');
  }

  async parseJsonOrSse(response) {
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (jsonError) {
      const parsed = this.parseSseResponse(text);
      if (parsed) {
        return parsed;
      }
      throw jsonError;
    }
  }

  parseSseResponse(text) {
    let finalResponse = null;
    const events = [];

    for (const block of text.split(/\r?\n\r?\n/)) {
      const eventLine = block.split(/\r?\n/).find(line => line.startsWith('event:'));
      const dataLines = block
        .split(/\r?\n/)
        .filter(line => line.startsWith('data:'))
        .map(line => line.slice(5).trim());

      if (dataLines.length === 0) {
        continue;
      }

      const dataText = dataLines.join('\n');
      if (dataText === '[DONE]') {
        continue;
      }

      try {
        const data = JSON.parse(dataText);
        const eventName = eventLine ? eventLine.slice(6).trim() : '';
        events.push({
          ...data,
          event: eventName || data.type
        });
        if (eventName === 'response.completed' || data.type === 'response.completed') {
          finalResponse = data.response || data;
        }
      } catch {
        // Ignore non-JSON SSE payloads.
      }
    }

    if (!finalResponse && events.length === 0) {
      return null;
    }

    if (!finalResponse) {
      return { output: events };
    }

    const existingOutput = Array.isArray(finalResponse.output) ? finalResponse.output : [];
    return {
      ...finalResponse,
      output: [
        ...existingOutput,
        ...events
      ]
    };
  }

  async parseImageResponse(response) {
    if (!response.ok) {
      const errorData = await this.parseErrorResponse(response);
      throw { response: { status: response.status, data: errorData } };
    }

    return await response.json();
  }

  extractImage(data) {
    if (!data.data || data.data.length === 0) {
      throw new Error('No image was generated');
    }

    const imageData = data.data[0];
    if (imageData.b64_json) {
      return {
        url: `data:image/png;base64,${imageData.b64_json}`,
        text: imageData.revised_prompt || null,
        model: imageData.model
      };
    }

    if (imageData.url) {
      return {
        url: imageData.url,
        text: imageData.revised_prompt || null,
        model: imageData.model
      };
    }

    throw new Error('No image data in response');
  }

  jsonHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      'User-Agent': 'curl/8.7.1',
      'Accept': 'application/json'
    };
  }

  formHeaders() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'User-Agent': 'curl/8.7.1',
      'Accept': 'application/json'
    };
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

  resolveEditSize(request, modelConfig) {
    const supportedRatios = modelConfig?.aspectRatios || ['1024x1024'];
    const canUseAuto = supportedRatios.includes('auto');

    if ((!request.aspectRatio || request.aspectRatio === 'auto') && canUseAuto) {
      return 'auto';
    }

    if (request.aspectRatio) {
      return this.convertAspectRatio(request.aspectRatio, supportedRatios);
    }

    return canUseAuto ? 'auto' : supportedRatios[0];
  }

  async parseErrorResponse(response) {
    const text = await response.text().catch(() => '');
    if (!text) {
      return {};
    }

    try {
      return JSON.parse(text);
    } catch {
      return { message: this.summarizeHtmlError(text) };
    }
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

      const message = this.extractErrorMessage(data);
      if (message) {
        return new Error(`OpenAI error: ${message}`);
      }

      return new Error(`OpenAI request failed with status ${status}`);
    }

    if (error.message) {
      return new Error(`OpenAI error: ${error.message}`);
    }

    console.error(`Error in OpenAI adapter (${context}):`, error);
    return new Error('Unknown error occurred in OpenAI adapter');
  }

  extractErrorMessage(data) {
    if (!data) {
      return '';
    }

    if (typeof data === 'string') {
      return data;
    }

    if (data.error) {
      if (typeof data.error === 'string') {
        return data.error;
      }
      return data.error.message || data.error.code || JSON.stringify(data.error);
    }

    return data.message || data.msg || data.detail || '';
  }

  summarizeHtmlError(text) {
    const titleMatch = text.match(/<title[^>]*>(.*?)<\/title>/is);
    if (titleMatch) {
      return titleMatch[1].replace(/\s+/g, ' ').trim();
    }

    return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500);
  }
}
