import * as Joi from 'joi';

export const configSchema = Joi.object({
  NATS_URL: Joi.string().uri().required(),
  SERVICE_NAME: Joi.string().required(),
  MICROSERVICE_URL: Joi.string().uri().default('http://localhost:3000'),
  MICROSERVICE_TIMEOUT: Joi.number().default(5000),
  HEALTH_CHECK_INTERVAL: Joi.number().default(30000),
  HEARTBEAT_INTERVAL: Joi.number().default(10000),
});
