import { Test, TestingModule } from '@nestjs/testing';
import { GdprActionRegistry } from './gdpr.registry';
import { GdprActionHandler } from './gdpr.handler.interface';

describe('GdprActionRegistry', () => {
  let registry: GdprActionRegistry;

  const createMockHandler = (): GdprActionHandler => ({
    execute: jest.fn(),
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GdprActionRegistry],
    }).compile();

    registry = module.get<GdprActionRegistry>(GdprActionRegistry);
  });

  describe('register()', () => {
    it('registers a handler for an action', () => {
      const handler = createMockHandler();

      registry.register('delete', handler);

      expect(registry.has('delete')).toBe(true);
    });

    it('overwrites existing handler when registering same action', () => {
      const handler1 = createMockHandler();
      const handler2 = createMockHandler();

      registry.register('delete', handler1);
      registry.register('delete', handler2);

      expect(registry.get('delete')).toBe(handler2);
    });
  });

  describe('get()', () => {
    it('returns the registered handler for an action', () => {
      const handler = createMockHandler();
      registry.register('export', handler);

      expect(registry.get('export')).toBe(handler);
    });

    it('returns undefined for unregistered action', () => {
      expect(registry.get('unknown')).toBeUndefined();
    });
  });

  describe('has()', () => {
    it('returns true when action is registered', () => {
      registry.register('delete', createMockHandler());

      expect(registry.has('delete')).toBe(true);
    });

    it('returns false when action is not registered', () => {
      expect(registry.has('unknown')).toBe(false);
    });
  });
});
