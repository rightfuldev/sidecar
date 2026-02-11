import { Test, TestingModule } from '@nestjs/testing';
import { DeleteHandler } from './delete.handler';
import { ApiHandlerService } from '../../api-handler/api-handler.service';
import { GdprAction, type ActionRequestMessage } from '@rightful/contracts';

describe('DeleteHandler', () => {
  let handler: DeleteHandler;
  let mockApiHandler: { deleteData: jest.Mock };

  const createRequest = (
    overrides: Partial<ActionRequestMessage> = {},
  ): ActionRequestMessage => ({
    action: GdprAction.DELETE,
    processId: 'process-123',
    userId: 'user-456',
    ...overrides,
  });

  beforeEach(async () => {
    mockApiHandler = {
      deleteData: jest.fn().mockResolvedValue({
        deleted: ['accounts', 'orders'],
        retained: ['invoices'],
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteHandler,
        { provide: ApiHandlerService, useValue: mockApiHandler },
      ],
    }).compile();

    handler = module.get<DeleteHandler>(DeleteHandler);
  });

  describe('execute()', () => {
    it('calls apiHandler.deleteData() with userId', async () => {
      const request = createRequest({ userId: 'user-789' });

      await handler.execute(request);

      expect(mockApiHandler.deleteData).toHaveBeenCalledWith('user-789');
    });

    it('returns deleted and retained from response', async () => {
      mockApiHandler.deleteData.mockResolvedValue({
        deleted: ['accounts', 'sessions'],
        retained: ['audit_logs'],
      });

      const result = await handler.execute(createRequest());

      expect(result).toEqual({
        deleted: ['accounts', 'sessions'],
        retained: ['audit_logs'],
      });
    });

    it('returns empty arrays when nothing deleted or retained', async () => {
      mockApiHandler.deleteData.mockResolvedValue({
        deleted: [],
        retained: [],
      });

      const result = await handler.execute(createRequest());

      expect(result).toEqual({
        deleted: [],
        retained: [],
      });
    });

    it('throws when apiHandler.deleteData() fails', async () => {
      const error = new Error('Database connection failed');
      mockApiHandler.deleteData.mockRejectedValue(error);

      await expect(handler.execute(createRequest())).rejects.toThrow(
        'Database connection failed',
      );
    });
  });
});
