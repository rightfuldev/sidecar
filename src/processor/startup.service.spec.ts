import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StartupService } from './startup.service';
import { ApiHandlerService } from '../api-handler/api-handler.service';
import { NatsPublisher } from '../nats/nats.publisher';
import { NatsSubjects } from '@rightful/contracts';

describe('StartupService', () => {
  let service: StartupService;
  let mockApiHandler: { health: jest.Mock; register: jest.Mock };
  let mockNatsPublisher: { publish: jest.Mock };

  const SERVICE_NAME = 'test-service';

  beforeEach(async () => {
    mockApiHandler = {
      health: jest.fn().mockResolvedValue({ status: 'ok' }),
      register: jest.fn().mockResolvedValue({
        actions: ['delete', 'export'],
        serviceVersion: '1.0.0',
      }),
    };
    mockNatsPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StartupService,
        { provide: ApiHandlerService, useValue: mockApiHandler },
        { provide: NatsPublisher, useValue: mockNatsPublisher },
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => SERVICE_NAME },
        },
      ],
    }).compile();

    service = module.get<StartupService>(StartupService);
  });

  describe('startup()', () => {
    it('calls health check before registration', async () => {
      const callOrder: string[] = [];
      mockApiHandler.health.mockImplementation(() => {
        callOrder.push('health');
        return Promise.resolve({ status: 'ok' });
      });
      mockApiHandler.register.mockImplementation(() => {
        callOrder.push('register');
        return Promise.resolve({ actions: [], serviceVersion: '1.0.0' });
      });

      await service.startup();

      expect(callOrder).toEqual(['health', 'register']);
    });

    it('calls apiHandler.health()', async () => {
      await service.startup();

      expect(mockApiHandler.health).toHaveBeenCalledTimes(1);
    });

    it('calls apiHandler.register()', async () => {
      await service.startup();

      expect(mockApiHandler.register).toHaveBeenCalledTimes(1);
    });

    it('publishes RegistrationMessage to gdpr.register subject', async () => {
      await service.startup();

      expect(mockNatsPublisher.publish).toHaveBeenCalledWith(
        NatsSubjects.REGISTER,
        expect.objectContaining({
          serviceName: SERVICE_NAME,
          sidecarVersion: '',
          actions: ['delete', 'export'],
          serviceVersion: '1.0.0',
        }),
      );
    });

    it('includes registration response in published message', async () => {
      mockApiHandler.register.mockResolvedValue({
        actions: ['delete'],
        serviceVersion: '2.0.0',
        customField: 'custom-value',
      });

      await service.startup();

      expect(mockNatsPublisher.publish).toHaveBeenCalledWith(
        NatsSubjects.REGISTER,
        expect.objectContaining({
          actions: ['delete'],
          serviceVersion: '2.0.0',
          customField: 'custom-value',
        }),
      );
    });

    it('throws when health check fails', async () => {
      const error = new Error('Microservice unreachable');
      mockApiHandler.health.mockRejectedValue(error);

      await expect(service.startup()).rejects.toThrow('Microservice unreachable');
      expect(mockApiHandler.register).not.toHaveBeenCalled();
      expect(mockNatsPublisher.publish).not.toHaveBeenCalled();
    });

    it('throws when registration fails', async () => {
      const error = new Error('Registration failed');
      mockApiHandler.register.mockRejectedValue(error);

      await expect(service.startup()).rejects.toThrow('Registration failed');
      expect(mockNatsPublisher.publish).not.toHaveBeenCalled();
    });

    it('throws when NATS publish fails', async () => {
      const error = new Error('NATS connection failed');
      mockNatsPublisher.publish.mockRejectedValue(error);

      await expect(service.startup()).rejects.toThrow('NATS connection failed');
    });
  });

  describe('onModuleInit()', () => {
    it('calls startup()', async () => {
      const startupSpy = jest.spyOn(service, 'startup');

      await service.onModuleInit();

      expect(startupSpy).toHaveBeenCalledTimes(1);
    });
  });
});
