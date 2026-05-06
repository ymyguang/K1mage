export const GEMINI_MOCK_RESPONSES = {
  generateImage: {
    success: {
      candidates: [{
        content: {
          parts: [{
            inlineData: {
              mimeType: 'image/png',
              data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
            }
          }]
        },
        finishReason: 'STOP',
        safetyRatings: []
      }]
    },
    error: {
      error: {
        code: 400,
        message: 'Invalid request',
        status: 'INVALID_ARGUMENT'
      }
    }
  },
  editImage: {
    success: {
      candidates: [{
        content: {
          parts: [{
            inlineData: {
              mimeType: 'image/png',
              data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
            }
          }]
        },
        finishReason: 'STOP',
        safetyRatings: []
      }]
    }
  }
};
