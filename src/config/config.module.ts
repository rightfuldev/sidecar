import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { natsConfig, serviceConfig, microserviceConfig } from './configuration';
import { configSchema } from './config.schema';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [natsConfig, serviceConfig, microserviceConfig],
      validationSchema: configSchema,
    }),
  ],
})
export class ConfigModule {}
