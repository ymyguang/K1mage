export const TONGYI_MOCK_RESPONSES = {
  generateImage: {
    success: {
      output: {
        task_id: 'task-123456',
        task_status: 'SUCCEEDED',
        results: [{
          url: 'https://example.com/generated-image.png'
        }]
      },
      request_id: 'req-123456'
    },
    pending: {
      output: {
        task_id: 'task-123456',
        task_status: 'PENDING'
      },
      request_id: 'req-123456'
    },
    error: {
      code: 'InvalidParameter',
      message: 'The request is invalid',
      request_id: 'req-123456'
    }
  }
};
