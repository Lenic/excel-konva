import type { IContainer } from '../../container';

import { IKonvaItems, IScrollOffset, ISheetConfig } from '../core';
import { COLUMN_TAG, IAccumulatedDimensionManager, IDimensionManager, ROW_TAG } from '../data';
import { IFrozenInformationManager, ISheetDimension } from '../ui';

import { CursorListener } from './cursor-listener';
import { StageDragListener } from './drag-listener';
import { StageMouseEvent } from './mouse-event';
import { ResizeItemListener } from './resize-item-listener';
import { SelectionStore } from './selection-store';
import { ICursorListener, IResizeItemListener, ISelectionStore, IStageDragListener, IStageMouseEvent } from './types';

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
      c.get(IFrozenInformationManager, ctx),
    );
  });

  container.register(IResizeItemListener).set((c, ctx) => {
    return new ResizeItemListener(
      c.get(IDimensionManager, ROW_TAG, ctx),
      c.get(IScrollOffset, ctx),
      c.get(IKonvaItems, ctx),
      c.get(IDimensionManager, COLUMN_TAG, ctx),
      c.get(ISheetConfig, ctx),
      c.get(IStageMouseEvent, ctx),
      c.get(ISheetDimension, ctx),
      c.get(ICursorListener, ctx),
      c.get(IAccumulatedDimensionManager, ROW_TAG, ctx),
      c.get(IAccumulatedDimensionManager, COLUMN_TAG, ctx),
      c.get(IFrozenInformationManager, ctx),
    );
  });
}
