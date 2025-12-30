import { combineLatest, map } from 'rxjs';

import { AccumulatedDimension } from './accumulatedDimension';
import { CellDimension } from './cellDimension';
import { DataRegion } from './dataRegion';
import { ItemBoundary } from './itemBoundary';
import { ItemDimension } from './itemDimension';
import { ScrollOffset } from './scrollOffset';
import { SheetDimension } from './sheetDimension';
import { SheetMeta } from './sheetMeta';

export const sheet = new SheetMeta(50000, 5000, 4, 3);
export const columnDimension = new ItemDimension(
  combineLatest([sheet.minColumnWidth$, sheet.headerWidth$, sheet.columnWidth$]).pipe(
    map((v) => ({ minDimension: v[0], headerDimension: v[1], defaultDimension: v[2] })),
  ),
);
export const rowDimension = new ItemDimension(
  combineLatest([sheet.minRowHeight$, sheet.headerHeight$, sheet.rowHeight$]).pipe(
    map((v) => ({ minDimension: v[0], headerDimension: v[1], defaultDimension: v[2] })),
  ),
);
export const accumulatedColumnDimension = new AccumulatedDimension(columnDimension, sheet.columnCount$);
export const accumulatedRowDimension = new AccumulatedDimension(rowDimension, sheet.rowCount$);
export const sheetDimension = new SheetDimension(sheet, accumulatedColumnDimension, accumulatedRowDimension);
export const scrollOffset = new ScrollOffset(sheetDimension);
export const itemBoundary = new ItemBoundary(scrollOffset, accumulatedColumnDimension, accumulatedRowDimension, sheet);
export const cellDimension = new CellDimension(itemBoundary);
export const dataRegion = new DataRegion(sheet, itemBoundary, sheetDimension);
