import type { IBoundaryResizeListener, ISelectionStore, IStageClickListener, IStageMouseEvent } from './types';

import { columnBoundary, config, rowBoundary, sheetDimension } from '../helpers';

import { StageClickListener } from './click';
import { StageMouseEvent } from './core';
import { BoundaryResizeListener } from './resize';
import { SelectionStore } from './selection';

export * from './types';

export const events: IStageMouseEvent = new StageMouseEvent();
export const selection: ISelectionStore = new SelectionStore();

export const resize: IBoundaryResizeListener = new BoundaryResizeListener(
  config,
  sheetDimension,
  columnBoundary,
  rowBoundary,
  events,
);
export const click: IStageClickListener = new StageClickListener(selection, events);
