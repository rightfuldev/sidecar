import { Module } from '@nestjs/common';
import { GdprActionRegistry } from './gdpr.registry';

@Module({
  controllers: [],
  providers: [GdprActionRegistry],
  exports: [GdprActionRegistry],
})
export class GdprModule {}
