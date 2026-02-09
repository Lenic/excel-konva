import type { IContainer } from '../../container';

import { IKonvaItems } from '../reference';

import { StageClickListener } from './click-listener';
import { StageDragListener } from './drag-listener';
import { StageMouseEvent } from './mouse-event';
import { SelectionStore } from './selection-store';
import { ISelectionStore, IStageClickListener, IStageDragListener, IStageMouseEvent } from './types';

/**
 * Registers event-related services in the DI container
 *
 * @param container - The target IOC container
 */
export function registerEvents(container: IContainer) {
  container.register(ISelectionStore).set(() => new SelectionStore());

  container.register(IStageMouseEvent).set((c, ctx) => {
    return new StageMouseEvent(c.get(IKonvaItems, ctx));
  });

  container.register(IStageClickListener).set((c, ctx) => {
    return new StageClickListener(c.get(ISelectionStore, ctx), c.get(IStageMouseEvent, ctx));
  });

  container.register(IStageDragListener).set((c, ctx) => {
    return new StageDragListener(c.get(ISelectionStore, ctx), c.get(IStageMouseEvent, ctx));
  });
}
