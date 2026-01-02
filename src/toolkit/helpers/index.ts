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

export const columnTag = Symbol('column');
export const rowTag = Symbol('row');

container.set(IItemDimension).set((c) => {
  const config = c.get(ISheetConfig);
  return new ItemDimension(
    combineLatest([config.minColumnWidth$, config.headerWidth$, config.columnWidth$]).pipe(
      map((v) => ({ minDimension: v[0], headerDimension: v[1], defaultDimension: v[2] })),
    ),
  );
}, columnTag);

container.set(IItemDimension).set((c) => {
  const config = c.get(ISheetConfig);
  return new ItemDimension(
    combineLatest([config.minRowHeight$, config.headerHeight$, config.rowHeight$]).pipe(
      map((v) => ({ minDimension: v[0], headerDimension: v[1], defaultDimension: v[2] })),
    ),
  );
}, rowTag);

container.set(IAccumulatedDimension).set((c) => {
  const columnDimension = c.get(IItemDimension, columnTag);
  const config = c.get(ISheetConfig);
  return new AccumulatedDimension(columnDimension, config.columnCount$);
}, columnTag);

container.set(IAccumulatedDimension).set((c) => {
  const rowDimension = c.get(IItemDimension, rowTag);
  const config = c.get(ISheetConfig);
  return new AccumulatedDimension(rowDimension, config.rowCount$);
}, rowTag);

container.set(ISheetDimension).set((c) => {
  const config = c.get(ISheetConfig);
  const accumulatedColumnDimension = c.get(IAccumulatedDimension, columnTag);
  const accumulatedRowDimension = c.get(IAccumulatedDimension, rowTag);
  return new SheetDimension(config, accumulatedColumnDimension, accumulatedRowDimension);
});

container.set(IScrollOffset).set((c) => {
  const sheetDimension = c.get(ISheetDimension);
  return new ScrollOffset(sheetDimension);
});

container.set(IItemBoundary).set((c) => {
  const accumulatedColumnDimension = c.get(IAccumulatedDimension, columnTag);
  return new ItemBoundary(accumulatedColumnDimension, {
    scrollValue$: c.get(IScrollOffset).left$,
    frozenCount$: c.get(ISheetConfig).frozenColumns$,
  });
}, columnTag);

container.set(IItemBoundary).set((c) => {
  const accumulatedRowDimension = c.get(IAccumulatedDimension, rowTag);
  return new ItemBoundary(accumulatedRowDimension, {
    scrollValue$: c.get(IScrollOffset).top$,
    frozenCount$: c.get(ISheetConfig).frozenRows$,
  });
}, rowTag);

container.set(ICellDimension).set((c) => {
  return new CellDimension(c.get(IItemBoundary, columnTag), c.get(IItemBoundary, rowTag));
});

container.set(IDataRegion).set((c) => {
  return new DataRegion(
    c.get(ISheetConfig),
    c.get(IItemBoundary, columnTag),
    c.get(IItemBoundary, rowTag),
    c.get(ISheetDimension),
  );
});
