import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { of, throwError } from 'rxjs';
import { ApiHandlerService } from './api-handler.service';
import {
  ContractValidationError,
  MicroserviceRequestError,
} from './api-handler.errors';
import * as contracts from '@rightful/contracts';

jest.mock('@rightful/contracts', () => ({
  HealthResponseSchema: { parse: jest.fn((data: unknown) => data) },
  RegisterResponseSchema: { parse: jest.fn((data: unknown) => data) },
  DeleteResponseSchema: { parse: jest.fn((data: unknown) => data) },
  ExportResponseSchema: { parse: jest.fn((data: unknown) => data) },
}));

const mockedContracts = jest.mocked(contracts);

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

  describe('endpoint routing', () => {
    it('health() calls GET /gdpr/health', async () => {
      mockHttpService.get.mockReturnValue(of(mockAxiosResponse({})));

      await service.health();

      expect(mockHttpService.get).toHaveBeenCalledWith('/gdpr/health');
    });

    it('register() calls GET /gdpr/register', async () => {
      mockHttpService.get.mockReturnValue(of(mockAxiosResponse({})));

      await service.register();

      expect(mockHttpService.get).toHaveBeenCalledWith('/gdpr/register');
    });

    it('deleteData() calls DELETE /gdpr/{userId}', async () => {
      mockHttpService.delete.mockReturnValue(of(mockAxiosResponse({})));

      await service.deleteData('user-123');

      expect(mockHttpService.delete).toHaveBeenCalledWith('/gdpr/user-123');
    });

    it('exportData() calls POST /gdpr/{userId}', async () => {
      mockHttpService.post.mockReturnValue(of(mockAxiosResponse({})));

      await service.exportData('user-123');

      expect(mockHttpService.post).toHaveBeenCalledWith('/gdpr/user-123');
    });
  });

  describe('error handling', () => {
    it('throws MicroserviceRequestError when HTTP request fails', async () => {
      const error = new Error('Connection refused');
      mockHttpService.get.mockReturnValue(throwError(() => error));

      await expect(service.health()).rejects.toThrow(MicroserviceRequestError);
      await expect(service.health()).rejects.toMatchObject({
        endpoint: '/gdpr/health',
        cause: error,
      });
    });

    it('throws ContractValidationError when schema.parse() throws', async () => {
      (
        mockedContracts.HealthResponseSchema.parse as jest.Mock
      ).mockImplementationOnce(() => {
        throw new Error('Invalid');
      });
      mockHttpService.get.mockReturnValue(of(mockAxiosResponse({})));

      await expect(service.health()).rejects.toThrow(ContractValidationError);
    });
  });
});
