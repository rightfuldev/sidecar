import { Module } from '@nestjs/common';
import { GdprActionRegistry } from './gdpr.registry';

@Module({
  controllers: [],
  providers: [GdprActionRegistry],
})
export class GdprModule {}
