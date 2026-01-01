import type { IRenderListener } from './types';

import { selectionStore } from '../events';
import { cellDimension, config, sheetDimension } from '../helpers';

import { SelectionListener } from './selection';

export * from './types';

export const selectionListener: IRenderListener<number> = new SelectionListener(
  config,
  sheetDimension,
  cellDimension,
  selectionStore,
);
