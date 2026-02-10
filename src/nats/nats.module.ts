import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { NatsPublisher } from './nats.publisher';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'NATS_CLIENT',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [configService.getOrThrow<string>('nats.url')],
            jetstream: true,
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  providers: [NatsPublisher],
  exports: [NatsPublisher],
})
export class NatsModule {}
