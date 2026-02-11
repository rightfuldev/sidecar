import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { NatsModule } from './nats/nats.module';
import { ApiHandlerModule } from './api-handler/api-handler.module';

@Module({
  imports: [ConfigModule, NatsModule, ApiHandlerModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
