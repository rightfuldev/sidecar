import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NatsContext } from '@nestjs/microservices';
import { ProcessorController } from './processor.controller';
import { GdprActionRegistry } from '../gdpr/gdpr.registry';
import { NatsPublisher } from '../nats/nats.publisher';
import { GdprActionHandler } from '../gdpr/gdpr.handler.interface';
import {
  GdprAction,
  NatsSubjects,
  type ActionRequestMessage,
} from '@rightful/contracts';

describe('ProcessorController', () => {
  let controller: ProcessorController;
  let mockRegistry: { get: jest.Mock };
  let mockNatsPublisher: { publish: jest.Mock };

  const SERVICE_NAME = 'test-service';

  const createMockContext = (subject: string): NatsContext =>
    ({ getSubject: () => subject }) as unknown as NatsContext;

  const createValidPayload = (
    overrides: Partial<ActionRequestMessage> = {},
  ): ActionRequestMessage => ({
    action: GdprAction.DELETE,
    processId: 'process-123',
    userId: 'user-456',
    ...overrides,
  });

  beforeEach(async () => {
    mockRegistry = { get: jest.fn() };
    mockNatsPublisher = { publish: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProcessorController],
      providers: [
        { provide: GdprActionRegistry, useValue: mockRegistry },
        { provide: NatsPublisher, useValue: mockNatsPublisher },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => SERVICE_NAME },
        },
      ],
    }).compile();

    controller = module.get<ProcessorController>(ProcessorController);
  });

  describe('message filtering', () => {
    it('ignores messages for other services', async () => {
      const context = createMockContext('gdpr.action.other-service');

      await controller.handleAction(createValidPayload(), context);

      expect(mockRegistry.get).not.toHaveBeenCalled();
      expect(mockNatsPublisher.publish).not.toHaveBeenCalled();
    });

    it('processes messages for this service', async () => {
      const context = createMockContext(`gdpr.action.${SERVICE_NAME}`);
      const handler: GdprActionHandler = {
        execute: jest.fn().mockResolvedValue({}),
      };
      mockRegistry.get.mockReturnValue(handler);

      await controller.handleAction(createValidPayload(), context);

      expect(mockRegistry.get).toHaveBeenCalledWith(GdprAction.DELETE);
    });
  });

  describe('message validation', () => {
    it('returns early for invalid message format', async () => {
      const context = createMockContext(`gdpr.action.${SERVICE_NAME}`);

      await controller.handleAction({ invalid: 'payload' }, context);

      expect(mockRegistry.get).not.toHaveBeenCalled();
      expect(mockNatsPublisher.publish).not.toHaveBeenCalled();
    });
  });

  describe('handler execution', () => {
    it('publishes error when no handler is registered', async () => {
      const context = createMockContext(`gdpr.action.${SERVICE_NAME}`);
      const payload = createValidPayload();
      mockRegistry.get.mockReturnValue(undefined);

      await controller.handleAction(payload, context);

      expect(mockNatsPublisher.publish).toHaveBeenCalledWith(
        NatsSubjects.processError('process-123'),
        expect.objectContaining({
          processId: 'process-123',
          serviceName: SERVICE_NAME,
          action: GdprAction.DELETE,
          error: `Unsupported action: ${GdprAction.DELETE}`,
        }),
      );
    });

    it('publishes receipt before executing handler', async () => {
      const context = createMockContext(`gdpr.action.${SERVICE_NAME}`);
      const payload = createValidPayload();
      const handler: GdprActionHandler = {
        execute: jest.fn().mockResolvedValue({}),
      };
      mockRegistry.get.mockReturnValue(handler);

      await controller.handleAction(payload, context);

      expect(mockNatsPublisher.publish).toHaveBeenCalledWith(
        NatsSubjects.processAck('process-123'),
        expect.objectContaining({
          processId: 'process-123',
          serviceName: SERVICE_NAME,
          action: GdprAction.DELETE,
        }),
      );
    });

    it('executes handler with request data', async () => {
      const context = createMockContext(`gdpr.action.${SERVICE_NAME}`);
      const payload = createValidPayload();
      const executeMock = jest.fn().mockResolvedValue({});
      const handler: GdprActionHandler = { execute: executeMock };
      mockRegistry.get.mockReturnValue(handler);

      await controller.handleAction(payload, context);

      expect(executeMock).toHaveBeenCalledWith(payload);
    });

    it('publishes completion after successful execution', async () => {
      const context = createMockContext(`gdpr.action.${SERVICE_NAME}`);
      const payload = createValidPayload();
      const result = { deletedRecords: 5 };
      const handler: GdprActionHandler = {
        execute: jest.fn().mockResolvedValue(result),
      };
      mockRegistry.get.mockReturnValue(handler);

      await controller.handleAction(payload, context);

      expect(mockNatsPublisher.publish).toHaveBeenCalledWith(
        NatsSubjects.processAck('process-123'),
        expect.objectContaining({
          processId: 'process-123',
          serviceName: SERVICE_NAME,
          action: GdprAction.DELETE,
          result,
        }),
      );
    });

    it('publishes error when handler throws', async () => {
      const context = createMockContext(`gdpr.action.${SERVICE_NAME}`);
      const payload = createValidPayload();
      const handler: GdprActionHandler = {
        execute: jest.fn().mockRejectedValue(new Error('Execution error')),
      };
      mockRegistry.get.mockReturnValue(handler);

      await controller.handleAction(payload, context);

      expect(mockNatsPublisher.publish).toHaveBeenCalledWith(
        NatsSubjects.processError('process-123'),
        expect.objectContaining({
          processId: 'process-123',
          serviceName: SERVICE_NAME,
          action: GdprAction.DELETE,
          error: 'Execution error',
        }),
      );
    });

    it('publishes "Unknown error" when handler throws non-Error', async () => {
      const context = createMockContext(`gdpr.action.${SERVICE_NAME}`);
      const payload = createValidPayload();
      const handler: GdprActionHandler = {
        execute: jest.fn().mockRejectedValue('string error'),
      };
      mockRegistry.get.mockReturnValue(handler);

      await controller.handleAction(payload, context);

      expect(mockNatsPublisher.publish).toHaveBeenCalledWith(
        NatsSubjects.processError('process-123'),
        expect.objectContaining({
          error: 'Unknown error',
        }),
      );
    });
  });
});
