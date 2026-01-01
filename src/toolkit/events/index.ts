import type {
  IBoundaryResizeListener,
  ISelectionStore,
  IStageClickListener,
  IStageDragListener,
  IStageEditListener,
  IStageMouseEvent,
} from './types';

import { cellDimension, columnBoundary, config, rowBoundary, scrollOffset, sheetDimension } from '../helpers';

import { StageClickListener } from './click';
import { StageMouseEvent } from './core';
import { StageDragListener } from './drag';
import { StageEditListener } from './edit';
import { BoundaryResizeListener } from './resize';
import { SelectionStore } from './selection';

export * from './types';

export const events: IStageMouseEvent = new StageMouseEvent();
export const selectionStore: ISelectionStore = new SelectionStore();

export const resize: IBoundaryResizeListener = new BoundaryResizeListener(
  config,
  sheetDimension,
  columnBoundary,
  rowBoundary,
  events,
);
export const click: IStageClickListener = new StageClickListener(selectionStore, events);
export const drag: IStageDragListener = new StageDragListener(selectionStore, events, cellDimension);
export const edit: IStageEditListener = new StageEditListener(events, cellDimension, scrollOffset);
