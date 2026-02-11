import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ExportHandler } from './export.handler';
import { ApiHandlerService } from '../../api-handler/api-handler.service';
import { GdprAction, type ActionRequestMessage } from '@rightful/contracts';

describe('ExportHandler', () => {
  let handler: ExportHandler;
  let mockApiHandler: { exportData: jest.Mock };
  let mockHttpService: { put: jest.Mock };

  const createRequest = (
    overrides: Partial<ActionRequestMessage> = {},
  ): ActionRequestMessage => ({
    action: GdprAction.EXPORT,
    processId: 'process-123',
    userId: 'user-456',
    uploadUrl: 'https://s3.amazonaws.com/bucket/presigned-url',
    s3Key: 'exports/user-456/data.json',
    ...overrides,
  });

  beforeEach(async () => {
    mockApiHandler = {
      exportData: jest.fn().mockResolvedValue({
        data: { accounts: [], orders: [] },
      }),
    };
    mockHttpService = {
      put: jest.fn().mockReturnValue(of({ status: 200 })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportHandler,
        { provide: ApiHandlerService, useValue: mockApiHandler },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    handler = module.get<ExportHandler>(ExportHandler);
  });

  describe('execute()', () => {
    it('throws when uploadUrl is missing', async () => {
      const request = createRequest({ uploadUrl: undefined });

      await expect(handler.execute(request)).rejects.toThrow(
        'Missing S3 uploadUrl or key',
      );
      expect(mockApiHandler.exportData).not.toHaveBeenCalled();
    });

    it('throws when s3Key is missing', async () => {
      const request = createRequest({ s3Key: undefined });

      await expect(handler.execute(request)).rejects.toThrow(
        'Missing S3 uploadUrl or key',
      );
      expect(mockApiHandler.exportData).not.toHaveBeenCalled();
    });

    it('calls apiHandler.exportData() with userId', async () => {
      const request = createRequest({ userId: 'user-789' });

      await handler.execute(request);

      expect(mockApiHandler.exportData).toHaveBeenCalledWith('user-789');
    });

    it('uploads export data to S3 via presigned URL', async () => {
      const exportData = { accounts: [{ id: 1 }], orders: [{ id: 2 }] };
      mockApiHandler.exportData.mockResolvedValue({ data: exportData });
      const request = createRequest({
        uploadUrl: 'https://s3.example.com/presigned',
      });

      await handler.execute(request);

      expect(mockHttpService.put).toHaveBeenCalledWith(
        'https://s3.example.com/presigned',
        exportData,
        { headers: { 'Content-Type': 'application/json' } },
      );
    });

    it('returns s3Key on success', async () => {
      const request = createRequest({ s3Key: 'exports/user/file.json' });

      const result = await handler.execute(request);

      expect(result).toEqual({ s3Key: 'exports/user/file.json' });
    });

    it('converts s3Key to string', async () => {
      const request = createRequest({ s3Key: 12345 as unknown as string });

      const result = await handler.execute(request);

      expect(result).toEqual({ s3Key: '12345' });
    });

    it('throws when apiHandler.exportData() fails', async () => {
      const error = new Error('Export failed');
      mockApiHandler.exportData.mockRejectedValue(error);

      await expect(handler.execute(createRequest())).rejects.toThrow(
        'Export failed',
      );
      expect(mockHttpService.put).not.toHaveBeenCalled();
    });

    it('throws when S3 upload fails', async () => {
      const error = new Error('S3 upload failed');
      mockHttpService.put.mockReturnValue(throwError(() => error));

      await expect(handler.execute(createRequest())).rejects.toThrow(
        'S3 upload failed',
      );
    });
  });
});
