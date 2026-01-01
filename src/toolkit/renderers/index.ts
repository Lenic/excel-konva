import type { IRegionInfo } from '../types';
import type { IRenderListener } from './types';

import { selectionStore } from '../events';
import { cellDimension, config, dataRegion, sheetDimension } from '../helpers';

import { CellListener } from './cell';
import { SelectionListener } from './selection';

export * from './types';

export const selectionRenderer: IRenderListener<number> = new SelectionListener(
  config,
  sheetDimension,
  cellDimension,
  selectionStore,
);
export const cellRenderer: IRenderListener<IRegionInfo> = new CellListener(config, cellDimension, dataRegion);
