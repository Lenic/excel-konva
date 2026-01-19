import type { IContainer, TFactory } from '../../container';

import { combineLatest, map } from 'rxjs';

import { IExcelEntrance } from '../types';

import { AccumulatedDimension } from './accumulatedDimension';
import { CellDimension } from './cellDimension';
import { DataRegion } from './dataRegion';
import { ItemBoundary } from './itemBoundary';
import { ItemDimension } from './itemDimension';
import { ScrollOffset } from './scrollOffset';
import { SheetDimension } from './sheetDimension';
import {
  IAccumulatedDimension,
  ICellDimension,
  IDataRegion,
  IItemBoundary,
  IItemDimension,
  IScrollOffset,
  ISheetConfig,
  ISheetDimension,
} from './types';

export * from './sheetConfig';
export * from './types';

/**
 * The tag for column
 */
export const COLUMN_TAG = Symbol('column_tag');

/**
 * The tag for row
 */
export const ROW_TAG = Symbol('row_tag');

/**
 * Add helper class registrations to the container
 *
 * @param container - the target IOC container
 * @param sheetConfigFactory - the factory function to get `ISheetConfig` instance
 */
export function registerHelpers(container: IContainer, sheetConfigFactory: TFactory<ISheetConfig>) {
  container.register(ISheetConfig).set(sheetConfigFactory);

  container
    .register(IItemDimension)
    .set((c) => {
      const config = c.get(ISheetConfig);
      return new ItemDimension(
        combineLatest([config.get$('minColumnWidth'), config.get$('headerWidth'), config.get$('columnWidth')]).pipe(
          map((v) => ({ minDimension: v[0], headerDimension: v[1], defaultDimension: v[2] })),
        ),
      );
    }, COLUMN_TAG)
    .set((c) => {
      const config = c.get(ISheetConfig);
      return new ItemDimension(
        combineLatest([config.get$('minRowHeight'), config.get$('headerHeight'), config.get$('rowHeight')]).pipe(
          map((v) => ({ minDimension: v[0], headerDimension: v[1], defaultDimension: v[2] })),
        ),
      );
    }, ROW_TAG);

  container
    .register(IAccumulatedDimension)
    .set(
      (c) => new AccumulatedDimension(c.get(IItemDimension, COLUMN_TAG), c.get(ISheetConfig).get$('columnCount')),
      COLUMN_TAG,
    )
    .set(
      (c) => new AccumulatedDimension(c.get(IItemDimension, ROW_TAG), c.get(ISheetConfig).get$('rowCount')),
      ROW_TAG,
    );

  container
    .register(ISheetDimension)
    .set(
      (c) =>
        new SheetDimension(
          c.get(ISheetConfig),
          c.get(IAccumulatedDimension, COLUMN_TAG),
          c.get(IAccumulatedDimension, ROW_TAG),
          c.get(IExcelEntrance),
        ),
    );

  container.register(IScrollOffset).set((c) => new ScrollOffset(c.get(ISheetDimension), c.get(IExcelEntrance)));

  container
    .register(IItemBoundary)
    .set(
      (c) =>
        new ItemBoundary(c.get(IAccumulatedDimension, COLUMN_TAG), {
          scrollValue$: c.get(IScrollOffset).left$,
          frozenCount$: c.get(ISheetConfig).get$('frozenColumns'),
        }),
      COLUMN_TAG,
    )
    .set(
      (c) =>
        new ItemBoundary(c.get(IAccumulatedDimension, ROW_TAG), {
          scrollValue$: c.get(IScrollOffset).top$,
          frozenCount$: c.get(ISheetConfig).get$('frozenRows'),
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
}
