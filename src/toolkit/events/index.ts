import { container } from '../constants';
import {
  columnTag,
  ICellDimension,
  IItemBoundary,
  IScrollOffset,
  ISheetConfig,
  ISheetDimension,
  rowTag,
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

container.set(ISelectionStore).set(() => new SelectionStore());

container
  .set(IStageMouseEvent)
  .set(
    (c) =>
      new StageMouseEvent(
        c.get(ICellDimension),
        c.get(IItemBoundary, columnTag),
        c.get(ISheetConfig),
        c.get(IItemBoundary, rowTag),
        c.get(ISheetDimension),
      ),
  );

container
  .set(IBoundaryResizeListener)
  .set(
    (c) =>
      new BoundaryResizeListener(
        c.get(ISheetConfig),
        c.get(ISheetDimension),
        c.get(IItemBoundary, columnTag),
        c.get(IItemBoundary, rowTag),
        c.get(IStageMouseEvent),
      ),
  );

container.set(IStageClickListener).set((c) => new StageClickListener(c.get(ISelectionStore), c.get(IStageMouseEvent)));

container
  .set(IStageDragListener)
  .set((c) => new StageDragListener(c.get(ISelectionStore), c.get(IStageMouseEvent), c.get(ICellDimension)));

container
  .set(IStageEditListener)
  .set((c) => new StageEditListener(c.get(IStageMouseEvent), c.get(ICellDimension), c.get(IScrollOffset)));
