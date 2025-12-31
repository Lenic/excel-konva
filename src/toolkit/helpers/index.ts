import type {
  IAccumulatedDimension,
  ICellDimension,
  IDataRegion,
  IItemBoundary,
  IItemDimension,
  IScrollOffset,
  ISheetConfig,
  ISheetDimension,
} from './types';

import { combineLatest, map } from 'rxjs';

import { AccumulatedDimension } from './accumulatedDimension';
import { CellDimension } from './cellDimension';
import { DataRegion } from './dataRegion';
import { ItemBoundary } from './itemBoundary';
import { ItemDimension } from './itemDimension';
import { ScrollOffset } from './scrollOffset';
import { SheetConfig } from './sheetConfig';
import { SheetDimension } from './sheetDimension';

export const config: ISheetConfig = new SheetConfig(50000, 5000, 4, 3);
export const columnDimension: ItemDimension = new ItemDimension(
  combineLatest([config.minColumnWidth$, config.headerWidth$, config.columnWidth$]).pipe(
    map((v) => ({ minDimension: v[0], headerDimension: v[1], defaultDimension: v[2] })),
  ),
);
export const rowDimension: IItemDimension = new ItemDimension(
  combineLatest([config.minRowHeight$, config.headerHeight$, config.rowHeight$]).pipe(
    map((v) => ({ minDimension: v[0], headerDimension: v[1], defaultDimension: v[2] })),
  ),
);
export const accumulatedColumnDimension: IAccumulatedDimension = new AccumulatedDimension(
  columnDimension,
  config.columnCount$,
);
export const accumulatedRowDimension: IAccumulatedDimension = new AccumulatedDimension(rowDimension, config.rowCount$);
export const sheetDimension: ISheetDimension = new SheetDimension(
  config,
  accumulatedColumnDimension,
  accumulatedRowDimension,
);
export const scrollOffset: IScrollOffset = new ScrollOffset(sheetDimension);
export const columnBoundary: IItemBoundary = new ItemBoundary(accumulatedColumnDimension, {
  scrollValue$: scrollOffset.left$,
  frozenCount$: config.frozenColumns$,
});
export const rowBoundary: IItemBoundary = new ItemBoundary(accumulatedRowDimension, {
  scrollValue$: scrollOffset.top$,
  frozenCount$: config.frozenRows$,
});
export const cellDimension: ICellDimension = new CellDimension(columnBoundary, rowBoundary);
export const dataRegion: IDataRegion = new DataRegion(config, columnBoundary, rowBoundary, sheetDimension);
