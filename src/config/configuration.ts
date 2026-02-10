import { registerAs } from '@nestjs/config';

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
