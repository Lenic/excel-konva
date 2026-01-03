import { container } from '../constants';
import {
  COLUMN_TAG,
  ICellDimension,
  IItemBoundary,
  IScrollOffset,
  ISheetConfig,
  ISheetDimension,
  ROW_TAG,
} from '../helpers';

import { StageClickListener } from './click';
import { StageMouseEvent } from './core';
import { StageDragListener } from './drag';
import { StageEditListener } from './edit';
import { BoundaryResizeListener } from './resize';
import { SelectionStore } from './selection';
import {
  IBoundaryResizeListener,
  ISelectionStore,
  IStageClickListener,
  IStageDragListener,
  IStageEditListener,
  IStageMouseEvent,
} from './types';

export * from './types';

container.register(ISelectionStore).set(() => new SelectionStore());

container
  .register(IStageMouseEvent)
  .set(
    (c) =>
      new StageMouseEvent(
        c.get(ICellDimension),
        c.get(IItemBoundary, COLUMN_TAG),
        c.get(ISheetConfig),
        c.get(IItemBoundary, ROW_TAG),
        c.get(ISheetDimension),
      ),
  );

container
  .register(IBoundaryResizeListener)
  .set(
    (c) =>
      new BoundaryResizeListener(
        c.get(ISheetConfig),
        c.get(ISheetDimension),
        c.get(IItemBoundary, COLUMN_TAG),
        c.get(IItemBoundary, ROW_TAG),
        c.get(IStageMouseEvent),
      ),
  );

container
  .register(IStageClickListener)
  .set((c) => new StageClickListener(c.get(ISelectionStore), c.get(IStageMouseEvent)));

container
  .register(IStageDragListener)
  .set((c) => new StageDragListener(c.get(ISelectionStore), c.get(IStageMouseEvent), c.get(ICellDimension)));

container
  .register(IStageEditListener)
  .set((c) => new StageEditListener(c.get(IStageMouseEvent), c.get(ICellDimension), c.get(IScrollOffset)));
