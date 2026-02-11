import { Module, OnModuleInit } from '@nestjs/common';
import { GdprActionRegistry } from './gdpr.registry';
import { DeleteHandler } from './handlers/delete.handler';
import { ExportHandler } from './handlers/export.handler';
import { GdprAction } from '@rightful/contracts';
import { ApiHandlerModule } from '../api-handler/api-handler.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [ApiHandlerModule, HttpModule],
  providers: [GdprActionRegistry, DeleteHandler, ExportHandler],
  exports: [GdprActionRegistry],
})
export class GdprModule implements OnModuleInit {
  constructor(
    private readonly registry: GdprActionRegistry,
    private readonly deleteHandler: DeleteHandler,
    private readonly exportHandler: ExportHandler,
  ) {}

  onModuleInit() {
    this.registry.register(GdprAction.DELETE, this.deleteHandler);
    this.registry.register(GdprAction.EXPORT, this.exportHandler);
  }
}
