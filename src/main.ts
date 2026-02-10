import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const configService = appContext.get(ConfigService);
  const natsUrl = configService.getOrThrow<string>('nats.url');
  const serviceName = configService.getOrThrow<string>('service.name');
  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.NATS,
      options: {
        servers: [natsUrl],
        gracefulShutdown: true,
        queue: serviceName,
      },
    },
  );
  await app.listen();
}
bootstrap();
