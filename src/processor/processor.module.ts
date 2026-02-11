import { Module } from '@nestjs/common';
import { ProcessorController } from './processor.controller';
import { GdprModule } from '../gdpr/gdpr.module';
import { NatsModule } from '../nats/nats.module';

@Module({
  imports: [GdprModule, NatsModule],
  controllers: [ProcessorController],
})
export class ProcessorModule {}
