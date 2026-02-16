import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { NatsModule } from './nats/nats.module';
import { ApiHandlerModule } from './api-handler/api-handler.module';
import { GdprModule } from './gdpr/gdpr.module';
import { ProcessorModule } from './processor/processor.module';

@Module({
  imports: [
    ConfigModule,
    NatsModule,
    ApiHandlerModule,
    GdprModule,
    ProcessorModule,
  ],
})
export class AppModule {}
