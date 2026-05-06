export const OPENAI_MOCK_RESPONSES = {
  generateImage: {
    success: {
      created: Date.now(),
      data: [{
        b64_json: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        revised_prompt: 'A beautiful sunset over the ocean'
      }]
    },
    error: {
      error: {
        message: 'Invalid API key',
        type: 'invalid_request_error',
        code: 'invalid_api_key'
      }
    }
  }
};
