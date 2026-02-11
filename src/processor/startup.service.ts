import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ApiHandlerService } from '../api-handler/api-handler.service';
import { NatsSubjects, RegistrationMessage } from '@rightful/contracts';
import { NatsPublisher } from '../nats/nats.publisher';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StartupService implements OnModuleInit {
  private readonly logger: Logger = new Logger(StartupService.name);

  constructor(
    private readonly apiHandler: ApiHandlerService,
    private readonly natsPublisher: NatsPublisher,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.startup();
  }

  async startup() {
    await this.apiHandler.health();

    const registrationRes = await this.apiHandler.register();

    const message: RegistrationMessage = {
      serviceName: this.configService.getOrThrow('service.name'),
      sidecarVersion: '',
      ...registrationRes,
    };

    await this.natsPublisher.publish(NatsSubjects.REGISTER, message);
    this.logger.log('Sidecar registered successfully');
  }
}
