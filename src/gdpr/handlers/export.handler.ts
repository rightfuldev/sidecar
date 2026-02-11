import { Injectable, Logger } from '@nestjs/common';
import { GdprActionHandler } from '../gdpr.handler.interface';
import { ActionRequestMessage, ActionResult } from '@rightful/contracts';
import { ApiHandlerService } from '../../api-handler/api-handler.service';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ExportHandler implements GdprActionHandler {
  private readonly logger: Logger = new Logger(ExportHandler.name);

  constructor(
    private readonly apiHandler: ApiHandlerService,
    private readonly httpService: HttpService,
  ) {}

  async execute(request: ActionRequestMessage): Promise<ActionResult> {
    this.logger.log(`Initiate export handler for userId=${request.userId}`);

    const { uploadUrl, s3Key, processId } = request;

    if (!uploadUrl || !s3Key) {
      this.logger.error(
        `No s3 uploadUrl or key were provided for process=${processId}`,
      );
      throw new Error('Missing S3 uploadUrl or key');
    }

    const exportRes = await this.apiHandler.exportData(request.userId);
    await this.uploadToS3(uploadUrl, exportRes.data);
    return { s3Key: String(s3Key) };
  }

  private async uploadToS3(uploadUrl: string, data: unknown): Promise<void> {
    await lastValueFrom(
      this.httpService.put(uploadUrl, data, {
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  }
}
