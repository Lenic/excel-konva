import type { IContainer } from '../../container';

import { IContentManager } from '../contents';
import {
  COLUMN_TAG,
  ICellDimension,
  IItemBoundary,
  IScrollOffset,
  ISheetConfig,
  ISheetDimension,
  ROW_TAG,
} from '../helpers';
import { IExcelEntrance } from '../types';

import { StageClickListener } from './click';
import { StageMouseEvent } from './core';
import { CursorGetter } from './cursor';
import { StageDragListener } from './drag';
import { StageEditListener } from './edit';
import { BoundaryResizeListener } from './resize';
import { SelectionStore } from './selection';
import {
  IBoundaryResizeListener,
  ICursorGetter,
  ISelectionStore,
  IStageClickListener,
  IStageDragListener,
  IStageEditListener,
  IStageMouseEvent,
} from './types';

export * from './types';

/**
 * Add event listener registrations to the container
 *
 * @param container - the target IOC container
 */
export function registerEvents(container: IContainer) {
  container.register(ISelectionStore).set(() => new SelectionStore());

  container
    .register(IStageMouseEvent)
    .set(
      (c, ctx) =>
        new StageMouseEvent(
          c.get(ICellDimension, ctx),
          c.get(IItemBoundary, COLUMN_TAG, ctx),
          c.get(ISheetConfig, ctx),
          c.get(IItemBoundary, ROW_TAG, ctx),
          c.get(ISheetDimension, ctx),
          c.get(IExcelEntrance, ctx),
        ),
    );

  container
    .register(ICursorGetter)
    .set(
      (c, ctx) => new CursorGetter(c.get(IStageMouseEvent, ctx), c.get(IScrollOffset, ctx), c.get(IExcelEntrance, ctx)),
    );

  container
    .register(IBoundaryResizeListener)
    .set(
      (c, ctx) =>
        new BoundaryResizeListener(
          c.get(ISheetConfig, ctx),
          c.get(ISheetDimension, ctx),
          c.get(IItemBoundary, COLUMN_TAG, ctx),
          c.get(IItemBoundary, ROW_TAG, ctx),
          c.get(IStageMouseEvent, ctx),
          c.get(IExcelEntrance, ctx),
          c.get(ICursorGetter, ctx),
          c.get(ICellDimension, ctx),
        ),
    );

  container
    .register(IStageClickListener)
    .set((c, ctx) => new StageClickListener(c.get(ISelectionStore, ctx), c.get(IStageMouseEvent, ctx)));

  container
    .register(IStageDragListener)
    .set(
      (c, ctx) =>
        new StageDragListener(
          c.get(ISheetConfig, ctx),
          c.get(ISelectionStore, ctx),
          c.get(IStageMouseEvent, ctx),
          c.get(ICellDimension, ctx),
          c.get(IExcelEntrance, ctx),
        ),
    );

  container
    .register(IStageEditListener)
    .set(
      (c, ctx) =>
        new StageEditListener(
          c.get(IStageMouseEvent, ctx),
          c.get(ICellDimension, ctx),
          c.get(IScrollOffset, ctx),
          c.get(IExcelEntrance, ctx),
          c.getAll(IContentManager, ctx),
          c.get(ISheetConfig, ctx),
        ),
    );
}
