import { ActionRequestMessage, ActionResult } from '@rightful/contracts';

export interface GdprActionHandler {
  execute(request: ActionRequestMessage): Promise<ActionResult>;
}
