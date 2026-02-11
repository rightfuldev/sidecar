import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { NatsPublisher } from './nats.publisher';

describe('NatsPublisher', () => {
  let publisher: NatsPublisher;
  let mockClient: { emit: jest.Mock };

  beforeEach(async () => {
    mockClient = { emit: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NatsPublisher,
        { provide: 'NATS_CLIENT', useValue: mockClient },
      ],
    }).compile();

    publisher = module.get<NatsPublisher>(NatsPublisher);
  });

  describe('publish()', () => {
    it('emits message to the correct subject', async () => {
      mockClient.emit.mockReturnValue(of(undefined));

      await publisher.publish('gdpr.register', { serviceName: 'test' });

      expect(mockClient.emit).toHaveBeenCalledWith('gdpr.register', {
        serviceName: 'test',
      });
    });

    it('emits message with complex data payload', async () => {
      mockClient.emit.mockReturnValue(of(undefined));
      const payload = {
        processId: 'proc-123',
        userId: 'user-456',
        action: 'delete',
        nested: { key: 'value' },
      };

      await publisher.publish('gdpr.action.service', payload);

      expect(mockClient.emit).toHaveBeenCalledWith(
        'gdpr.action.service',
        payload,
      );
    });

    it('resolves when emit completes successfully', async () => {
      mockClient.emit.mockReturnValue(of(undefined));

      await expect(
        publisher.publish('subject', { data: 'test' }),
      ).resolves.toBeUndefined();
    });

    it('rejects when emit throws an error', async () => {
      const error = new Error('NATS connection failed');
      mockClient.emit.mockReturnValue(throwError(() => error));

      await expect(publisher.publish('subject', {})).rejects.toThrow(
        'NATS connection failed',
      );
    });
  });
});
