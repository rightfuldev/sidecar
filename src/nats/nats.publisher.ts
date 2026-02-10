import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class NatsPublisher {
  constructor(@Inject('NATS_CLIENT') private readonly client: ClientProxy) {}

  async publish(subject: string, data: unknown): Promise<void> {
    await lastValueFrom(this.client.emit(subject, data));
  }
}
