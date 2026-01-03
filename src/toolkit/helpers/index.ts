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

container.register(ISheetConfig).set(() => new SheetConfig(50000, 5000, 4, 3));

export const COLUMN_TAG = Symbol('column_tag');
export const ROW_TAG = Symbol('row_tag');

container
  .register(IItemDimension)
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
  .register(IAccumulatedDimension)
  .set((c) => new AccumulatedDimension(c.get(IItemDimension, COLUMN_TAG), c.get(ISheetConfig).columnCount$), COLUMN_TAG)
  .set((c) => new AccumulatedDimension(c.get(IItemDimension, ROW_TAG), c.get(ISheetConfig).rowCount$), ROW_TAG);

container
  .register(ISheetDimension)
  .set(
    (c) =>
      new SheetDimension(
        c.get(ISheetConfig),
        c.get(IAccumulatedDimension, COLUMN_TAG),
        c.get(IAccumulatedDimension, ROW_TAG),
      ),
  );

container.register(IScrollOffset).set((c) => new ScrollOffset(c.get(ISheetDimension)));

container
  .register(IItemBoundary)
  .set(
    (c) =>
      new ItemBoundary(c.get(IAccumulatedDimension, COLUMN_TAG), {
        scrollValue$: c.get(IScrollOffset).left$,
        frozenCount$: c.get(ISheetConfig).frozenColumns$,
      }),
    COLUMN_TAG,
  )
  .set(
    (c) =>
      new ItemBoundary(c.get(IAccumulatedDimension, ROW_TAG), {
        scrollValue$: c.get(IScrollOffset).top$,
        frozenCount$: c.get(ISheetConfig).frozenRows$,
      }),
    ROW_TAG,
  );

container
  .register(ICellDimension)
  .set((c) => new CellDimension(c.get(IItemBoundary, COLUMN_TAG), c.get(IItemBoundary, ROW_TAG)));

container
  .register(IDataRegion)
  .set(
    (c) =>
      new DataRegion(
        c.get(ISheetConfig),
        c.get(IItemBoundary, COLUMN_TAG),
        c.get(IItemBoundary, ROW_TAG),
        c.get(ISheetDimension),
      ),
  );
