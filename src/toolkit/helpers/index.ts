import { combineLatest, map } from 'rxjs';

import { container } from '../constants';

import { AccumulatedDimension } from './accumulatedDimension';
import { CellDimension } from './cellDimension';
import { DataRegion } from './dataRegion';
import { ItemBoundary } from './itemBoundary';
import { ItemDimension } from './itemDimension';
import { ScrollOffset } from './scrollOffset';
import { SheetConfig } from './sheetConfig';
import { SheetDimension } from './sheetDimension';
import {
  IAccumulatedDimension,
  ICellDimension,
  IDataRegion,
  IItemBoundary,
  IScrollOffset,
  ISheetDimension,
} from './types';
import { IItemDimension, ISheetConfig } from './types';

export * from './types';

container.set(ISheetConfig).set(() => new SheetConfig(50000, 5000, 4, 3));

export const COLUMN_TAG = Symbol('column_tag');
export const ROW_TAG = Symbol('row_tag');

container
  .set(IItemDimension)
  .set((c) => {
    const config = c.get(ISheetConfig);
    return new ItemDimension(
      combineLatest([config.minColumnWidth$, config.headerWidth$, config.columnWidth$]).pipe(
        map((v) => ({ minDimension: v[0], headerDimension: v[1], defaultDimension: v[2] })),
      ),
    );
  }, COLUMN_TAG)
  .set((c) => {
    const config = c.get(ISheetConfig);
    return new ItemDimension(
      combineLatest([config.minRowHeight$, config.headerHeight$, config.rowHeight$]).pipe(
        map((v) => ({ minDimension: v[0], headerDimension: v[1], defaultDimension: v[2] })),
      ),
    );
  }, ROW_TAG);

container
  .set(IAccumulatedDimension)
  .set((c) => {
    const columnDimension = c.get(IItemDimension, COLUMN_TAG);
    const config = c.get(ISheetConfig);
    return new AccumulatedDimension(columnDimension, config.columnCount$);
  }, COLUMN_TAG)
  .set((c) => {
    const rowDimension = c.get(IItemDimension, ROW_TAG);
    const config = c.get(ISheetConfig);
    return new AccumulatedDimension(rowDimension, config.rowCount$);
  }, ROW_TAG);

container.set(ISheetDimension).set((c) => {
  const config = c.get(ISheetConfig);
  const accumulatedColumnDimension = c.get(IAccumulatedDimension, COLUMN_TAG);
  const accumulatedRowDimension = c.get(IAccumulatedDimension, ROW_TAG);
  return new SheetDimension(config, accumulatedColumnDimension, accumulatedRowDimension);
});

container.set(IScrollOffset).set((c) => {
  const sheetDimension = c.get(ISheetDimension);
  return new ScrollOffset(sheetDimension);
});

container
  .set(IItemBoundary)
  .set((c) => {
    const accumulatedColumnDimension = c.get(IAccumulatedDimension, COLUMN_TAG);
    return new ItemBoundary(accumulatedColumnDimension, {
      scrollValue$: c.get(IScrollOffset).left$,
      frozenCount$: c.get(ISheetConfig).frozenColumns$,
    });
  }, COLUMN_TAG)
  .set((c) => {
    const accumulatedRowDimension = c.get(IAccumulatedDimension, ROW_TAG);
    return new ItemBoundary(accumulatedRowDimension, {
      scrollValue$: c.get(IScrollOffset).top$,
      frozenCount$: c.get(ISheetConfig).frozenRows$,
    });
  }, ROW_TAG);

container.set(ICellDimension).set((c) => {
  return new CellDimension(c.get(IItemBoundary, COLUMN_TAG), c.get(IItemBoundary, ROW_TAG));
});

container.set(IDataRegion).set((c) => {
  return new DataRegion(
    c.get(ISheetConfig),
    c.get(IItemBoundary, COLUMN_TAG),
    c.get(IItemBoundary, ROW_TAG),
    c.get(ISheetDimension),
  );
});
