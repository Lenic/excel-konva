import type {
  IBoundaryResizeListener,
  ISelectionStore,
  IStageClickListener,
  IStageDragListener,
  IStageMouseEvent,
} from './types';

import { cellDimension, columnBoundary, config, rowBoundary, sheetDimension } from '../helpers';

import { StageClickListener } from './click';
import { StageMouseEvent } from './core';
import { StageDragListener } from './drag';
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
