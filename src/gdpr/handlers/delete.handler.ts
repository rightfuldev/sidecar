import { Injectable, Logger } from '@nestjs/common';
import { GdprActionHandler } from '../gdpr.handler.interface';
import { ActionRequestMessage, ActionResult } from '@rightful/contracts';
import { ApiHandlerService } from '../../api-handler/api-handler.service';

@Injectable()
export class DeleteHandler implements GdprActionHandler {
  private readonly logger: Logger = new Logger(DeleteHandler.name);

  constructor(private readonly apiHandler: ApiHandlerService) {}

  async execute(request: ActionRequestMessage): Promise<ActionResult> {
    this.logger.log(`Initiate delete handler for userId=${request.userId}`);

    const deleteRes = await this.apiHandler.deleteData(request.userId);

    return {
      deleted: deleteRes.deleted,
      retained: deleteRes.retained,
    };
  }
}
