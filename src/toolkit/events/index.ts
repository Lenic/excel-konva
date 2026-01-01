import type { IBoundaryResize, ISelectionStore, IStageMouseEvent } from './types';

import { columnBoundary, config, rowBoundary, sheetDimension } from '../helpers';

import { StageMouseEvent } from './core';
import { BoundaryResize } from './resize';
import { SelectionStore } from './selection';

export * from './types';

export const events: IStageMouseEvent = new StageMouseEvent();
export const resize: IBoundaryResize = new BoundaryResize(config, sheetDimension, columnBoundary, rowBoundary, events);
export const selection: ISelectionStore = new SelectionStore(events);
