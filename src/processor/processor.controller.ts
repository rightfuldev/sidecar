import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, NatsContext, Payload } from '@nestjs/microservices';
import {
  ActionRequestMessageSchema,
  NatsSubjects,
  type ActionRequestMessage,
  type ActionReceiptMessage,
  type ActionCompletionMessage,
  type ActionErrorMessage,
  ActionResult,
} from '@rightful/contracts';
import { GdprActionRegistry } from '../gdpr/gdpr.registry';
import { NatsPublisher } from '../nats/nats.publisher';
import { ConfigService } from '@nestjs/config';

@Controller()
export class ProcessorController {
  private readonly logger = new Logger(ProcessorController.name);
  private readonly serviceName: string;

  constructor(
    private readonly actionRegistry: GdprActionRegistry,
    private readonly natsPublisher: NatsPublisher,
    configService: ConfigService,
  ) {
    this.serviceName = configService.getOrThrow('service.name');
  }

  @EventPattern('gdpr.action.*')
  async handleAction(@Payload() raw: unknown, @Ctx() context: NatsContext) {
    const subject = context.getSubject();
    const [, , targetService] = subject.split('.');

    if (targetService !== this.serviceName) {
      this.logger.debug(`Ignoring message for service: ${targetService}`);
      return;
    }

    const parseResult = ActionRequestMessageSchema.safeParse(raw);
    if (!parseResult.success) {
      this.logger.error(
        'Failed to parse incoming action message',
        parseResult.error,
      );
      return;
    }
    const data = parseResult.data;
    const { action, processId } = data;

    this.logger.log(
      `Received action "${action}" for process ${processId} on subject ${subject}`,
    );

    const handler = this.actionRegistry.get(action);
    if (!handler) {
      this.logger.warn(`No handler registered for action: ${action}`);
      await this.publishError(data, `Unsupported action: ${action}`);
      return;
    }

    try {
      await this.publishReceipt(data);
      this.logger.debug(`Published receipt for process ${processId}`);

      const result = await handler.execute(data);
      this.logger.log(`Action "${action}" completed for process ${processId}`);

      await this.publishCompletion(data, result);
      this.logger.debug(`Published completion for process ${processId}`);
    } catch (error) {
      this.logger.error(
        `Action "${action}" failed for process ${processId}`,
        error,
      );
      await this.publishError(
        data,
        error instanceof Error ? error.message : 'Unknown error',
      );
    }
  }

  private async publishReceipt(data: ActionRequestMessage): Promise<void> {
    const message: ActionReceiptMessage = {
      processId: data.processId,
      serviceName: this.serviceName,
      action: data.action,
    };
    await this.natsPublisher.publish(
      NatsSubjects.processAck(data.processId),
      message,
    );
  }

  private async publishCompletion(
    data: ActionRequestMessage,
    result: ActionResult,
  ): Promise<void> {
    const message: ActionCompletionMessage = {
      processId: data.processId,
      serviceName: this.serviceName,
      action: data.action,
      result,
    };
    await this.natsPublisher.publish(
      NatsSubjects.processAck(data.processId),
      message,
    );
  }

  private async publishError(
    data: ActionRequestMessage,
    error: string,
  ): Promise<void> {
    const message: ActionErrorMessage = {
      processId: data.processId,
      serviceName: this.serviceName,
      action: data.action,
      error,
    };
    await this.natsPublisher.publish(
      NatsSubjects.processError(data.processId),
      message,
    );
  }
}
