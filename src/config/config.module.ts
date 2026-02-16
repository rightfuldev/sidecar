import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule, registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const natsConfig = registerAs('nats', () => ({
  url: process.env.NATS_URL,
}));

export const serviceConfig = registerAs('service', () => ({
  name: process.env.SERVICE_NAME,
}));

export const microserviceConfig = registerAs('microservice', () => ({
  url: process.env.MICROSERVICE_URL ?? 'http://localhost:3000',
  timeout: parseInt(process.env.MICROSERVICE_TIMEOUT ?? '5000', 10),
  healthCheckInterval: parseInt(
    process.env.HEALTH_CHECK_INTERVAL ?? '30000',
    10,
  ),
  heartbeatInterval: parseInt(process.env.HEARTBEAT_INTERVAL ?? '10000', 10),
}));

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [natsConfig, serviceConfig, microserviceConfig],
      validationSchema: Joi.object({
        NATS_URL: Joi.string().uri().required(),
        SERVICE_NAME: Joi.string().required(),
        MICROSERVICE_URL: Joi.string().uri().default('http://localhost:3000'),
        MICROSERVICE_TIMEOUT: Joi.number().default(5000),
        HEALTH_CHECK_INTERVAL: Joi.number().default(30000),
        HEARTBEAT_INTERVAL: Joi.number().default(10000),
      }),
    }),
  ],
})
export class ConfigModule {}
