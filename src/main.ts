import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AsyncMicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<AsyncMicroserviceOptions>(
    AppModule,
    {
      useFactory: (configService: ConfigService) => ({
        transport: Transport.NATS,
        options: {
          servers: [configService.getOrThrow<string>('nats.url')],
          gracefulShutdown: true,
          queue: configService.getOrThrow<string>('service.name'),
        },
      }),
      inject: [ConfigService],
    },
  );
  await app.listen();
}
bootstrap();
