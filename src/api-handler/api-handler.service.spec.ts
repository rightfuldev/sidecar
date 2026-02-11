import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { ApiHandlerService } from './api-handler.service';
import {
  ContractValidationError,
  MicroserviceRequestError,
} from './api-handler.errors';

const mockAxiosResponse = <T>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: { headers: {} } as AxiosResponse['config'],
});

describe('ApiHandlerService', () => {
  let service: ApiHandlerService;
  let mockHttpService: Record<string, jest.Mock>;

  beforeEach(async () => {
    mockHttpService = {
      get: jest.fn(),
      post: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiHandlerService,
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<ApiHandlerService>(ApiHandlerService);
  });

  describe('health', () => {
    it('should return health response when request succeeds', async () => {
      const healthResponse = { status: 'ok' };
      mockHttpService.get.mockReturnValue(
        of(mockAxiosResponse(healthResponse)),
      );

      const result = await service.health();

      expect(result).toEqual(healthResponse);
      expect(mockHttpService.get).toHaveBeenCalledWith('/gdpr/health');
    });

    it('should throw MicroserviceRequestError when request fails', async () => {
      const error = new Error('Connection refused');
      mockHttpService.get.mockReturnValue(throwError(() => error));

      await expect(service.health()).rejects.toThrow(MicroserviceRequestError);
      await expect(service.health()).rejects.toMatchObject({
        endpoint: '/gdpr/health',
        cause: error,
      });
    });

    it('should throw ContractValidationError when response does not match schema', async () => {
      mockHttpService.get.mockReturnValue(
        of(mockAxiosResponse({ invalid: 'response' })),
      );

      await expect(service.health()).rejects.toThrow(ContractValidationError);
      await expect(service.health()).rejects.toMatchObject({
        endpoint: '/gdpr/health',
      });
    });
  });

  describe('register', () => {
    it('should return register response when request succeeds', async () => {
      const registerResponse = {
        entities: [
          {
            name: 'users',
            stored: true,
            processed: true,
            dataCategory: 'STANDARD',
            personalDataTypes: ['email', 'name'],
            legalBasis: 'CONTRACT',
          },
        ],
        supportedActions: ['DELETE', 'EXPORT'],
      };
      mockHttpService.get.mockReturnValue(
        of(mockAxiosResponse(registerResponse)),
      );

      const result = await service.register();

      expect(result).toEqual(registerResponse);
      expect(mockHttpService.get).toHaveBeenCalledWith('/gdpr/register');
    });

    it('should throw MicroserviceRequestError when request fails', async () => {
      const error = new Error('Timeout');
      mockHttpService.get.mockReturnValue(throwError(() => error));

      await expect(service.register()).rejects.toThrow(
        MicroserviceRequestError,
      );
    });

    it('should throw ContractValidationError when response does not match schema', async () => {
      mockHttpService.get.mockReturnValue(of(mockAxiosResponse({})));

      await expect(service.register()).rejects.toThrow(ContractValidationError);
    });
  });

  describe('deleteData', () => {
    const userId = 'user-123';

    it('should return delete response when request succeeds', async () => {
      const deleteResponse = {
        userId,
        deleted: [{ entity: 'users', recordCount: 1 }],
        retained: [],
      };
      mockHttpService.delete.mockReturnValue(
        of(mockAxiosResponse(deleteResponse)),
      );

      const result = await service.deleteData(userId);

      expect(result).toEqual(deleteResponse);
      expect(mockHttpService.delete).toHaveBeenCalledWith(`/gdpr/${userId}`);
    });

    it('should throw MicroserviceRequestError when request fails', async () => {
      const error = new Error('Internal server error');
      mockHttpService.delete.mockReturnValue(throwError(() => error));

      await expect(service.deleteData(userId)).rejects.toThrow(
        MicroserviceRequestError,
      );
    });

    it('should throw ContractValidationError when response does not match schema', async () => {
      mockHttpService.delete.mockReturnValue(
        of(mockAxiosResponse({ wrong: 'format' })),
      );

      await expect(service.deleteData(userId)).rejects.toThrow(
        ContractValidationError,
      );
    });
  });

  describe('exportData', () => {
    const userId = 'user-456';

    it('should return export response when request succeeds', async () => {
      const exportResponse = {
        userId,
        data: [
          {
            entity: 'users',
            records: [{ id: userId, email: 'test@example.com' }],
          },
        ],
      };
      mockHttpService.post.mockReturnValue(
        of(mockAxiosResponse(exportResponse)),
      );

      const result = await service.exportData(userId);

      expect(result).toEqual(exportResponse);
      expect(mockHttpService.post).toHaveBeenCalledWith(`/gdpr/${userId}`);
    });

    it('should throw MicroserviceRequestError when request fails', async () => {
      const error = new Error('Service unavailable');
      mockHttpService.post.mockReturnValue(throwError(() => error));

      await expect(service.exportData(userId)).rejects.toThrow(
        MicroserviceRequestError,
      );
    });

    it('should throw ContractValidationError when response does not match schema', async () => {
      mockHttpService.post.mockReturnValue(of(mockAxiosResponse(null)));

      await expect(service.exportData(userId)).rejects.toThrow(
        ContractValidationError,
      );
    });
  });
});
