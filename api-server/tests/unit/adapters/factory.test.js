import { adapterFactory } from '../../../adapters/factory.js';

describe('Adapter Factory Unit Tests', () => {
  it('should be defined', () => {
    expect(adapterFactory).toBeDefined();
  });

  it('should have getAdapter method', () => {
    expect(typeof adapterFactory.getAdapter).toBe('function');
  });

  it('should have getAdapterForModel method', () => {
    expect(typeof adapterFactory.getAdapterForModel).toBe('function');
  });

  it('should throw error for unknown provider', () => {
    expect(() => adapterFactory.getAdapter('unknown')).toThrow();
  });

  it('should throw error for unknown model format', () => {
    expect(() => adapterFactory.getAdapterForModel('invalid-format')).toThrow();
  });
});
