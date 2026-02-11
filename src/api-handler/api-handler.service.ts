import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import {
  DeleteResponse,
  DeleteResponseSchema,
  ExportResponse,
  ExportResponseSchema,
  HealthResponse,
  HealthResponseSchema,
  RegisterResponse,
  RegisterResponseSchema,
} from '@rightful/contracts';
import { AxiosResponse } from 'axios';
import { lastValueFrom } from 'rxjs';
import { ZodSchema } from 'zod';
import {
  ContractValidationError,
  MicroserviceRequestError,
} from './api-handler.errors';

@Injectable()
export class ApiHandlerService {
  constructor(private readonly httpService: HttpService) {}

  private async request<T>(
    endpoint: string,
    method: 'get' | 'post' | 'delete',
    schema: ZodSchema<T>,
  ): Promise<T> {
    let res: AxiosResponse;
    try {
      res = await lastValueFrom(this.httpService[method](endpoint));
    } catch (error) {
      throw new MicroserviceRequestError(endpoint, error as Error);
    }

    try {
      return schema.parse(res.data);
    } catch (error) {
      throw new ContractValidationError(endpoint, error as Error);
    }
  }

  async health(): Promise<HealthResponse> {
    return this.request('/gdpr/health', 'get', HealthResponseSchema);
  }

  async register(): Promise<RegisterResponse> {
    return this.request('/gdpr/register', 'get', RegisterResponseSchema);
  }

  async deleteData(userId: string): Promise<DeleteResponse> {
    return this.request(`/gdpr/${userId}`, 'delete', DeleteResponseSchema);
  }

  async exportData(userId: string): Promise<ExportResponse> {
    return this.request(`/gdpr/${userId}`, 'post', ExportResponseSchema);
  }
}
