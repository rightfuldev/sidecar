import { Injectable } from '@nestjs/common';
import { GdprActionHandler } from './gdpr.handler.interface';

@Injectable()
export class GdprActionRegistry {
  private readonly actions: Map<string, GdprActionHandler> = new Map();

  register(action: string, handler: GdprActionHandler): void {
    this.actions.set(action, handler);
  }

  get(action: string): GdprActionHandler | undefined {
    return this.actions.get(action);
  }

  has(action: string): boolean {
    return this.actions.has(action);
  }
}
