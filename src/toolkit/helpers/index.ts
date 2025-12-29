import { CELL_HEIGHT, CELL_WIDTH, HEADER_HEIGHT, HEADER_WIDTH, MIN_CELL_HEIGHT, MIN_CELL_WIDTH } from '../constants';

import { AccumulatedDimension } from './accumulatedDimension';
import { CellManager } from './cellManager';
import { DimensionManager } from './dimensionManager';
import { ItemBoundaryManager } from './itemBoundaryManager';
import { ScrollOffset } from './scrollOffset';
import { Sheet } from './sheet';
import { SheetDimension } from './sheetDimension';

export const sheet = new Sheet(50000, 5000, 4, 3);

export const columnDimensionManager = new DimensionManager({
  minDimension: MIN_CELL_WIDTH,
  headerDimension: HEADER_WIDTH,
  defaultDimension: CELL_WIDTH,
});

export const rowDimensionManager = new DimensionManager({
  minDimension: MIN_CELL_HEIGHT,
  headerDimension: HEADER_HEIGHT,
  defaultDimension: CELL_HEIGHT,
});

export const accumulatedColumnDimension = new AccumulatedDimension(columnDimensionManager);
export const accumulatedRowDimension = new AccumulatedDimension(rowDimensionManager);

export const sheetDimension = new SheetDimension(sheet, accumulatedColumnDimension, accumulatedRowDimension);

export const scrollOffset = new ScrollOffset(sheetDimension);

export const itemBoundaryManager = new ItemBoundaryManager(
  scrollOffset,
  accumulatedColumnDimension,
  accumulatedRowDimension,
  sheet,
);

export const cellManager = new CellManager(columnDimensionManager, rowDimensionManager, itemBoundaryManager);
