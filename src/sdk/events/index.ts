import type { IContainer } from '../../container';

import { IScrollOffset } from '../core';
import { COLUMN_TAG, IAccumulatedDimensionManager, ROW_TAG } from '../data';
import { IKonvaItems } from '../reference';

import { StageClickListener } from './click-listener';
import { CursorListener } from './cursor-listener';
import { StageDragListener } from './drag-listener';
import { StageMouseEvent } from './mouse-event';
import { SelectionStore } from './selection-store';
import { ICursorListener, ISelectionStore, IStageClickListener, IStageDragListener, IStageMouseEvent } from './types';

export * from './types';

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

  container.register(ICursorListener).set((c, ctx) => {
    return new CursorListener(
      c.get(IKonvaItems, ctx).stage,
      c.get(IAccumulatedDimensionManager, ROW_TAG, ctx),
      c.get(IAccumulatedDimensionManager, COLUMN_TAG, ctx),
      c.get(IStageMouseEvent, ctx),
      c.get(IScrollOffset, ctx),
    );
  });
}
