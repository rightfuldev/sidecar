import { Module } from '@nestjs/common';
import { ProcessorController } from './processor.controller';
import { GdprModule } from '../gdpr/gdpr.module';
import { NatsModule } from '../nats/nats.module';
import { ApiHandlerModule } from '../api-handler/api-handler.module';
import { StartupService } from './startup.service';

@Module({
  imports: [GdprModule, NatsModule, ApiHandlerModule],
  controllers: [ProcessorController],
  providers: [StartupService],
})
export class ProcessorModule {}
