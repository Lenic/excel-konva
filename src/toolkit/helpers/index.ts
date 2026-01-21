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
    .set((c, ctx) => {
      const config = c.get(ISheetConfig, ctx);
      return new ItemDimension(
        combineLatest([config.get$('minColumnWidth'), config.get$('headerWidth'), config.get$('columnWidth')]).pipe(
          map((v) => ({ minDimension: v[0], headerDimension: v[1], defaultDimension: v[2] })),
        ),
      );
    }, COLUMN_TAG)
    .set((c, ctx) => {
      const config = c.get(ISheetConfig, ctx);
      return new ItemDimension(
        combineLatest([config.get$('minRowHeight'), config.get$('headerHeight'), config.get$('rowHeight')]).pipe(
          map((v) => ({ minDimension: v[0], headerDimension: v[1], defaultDimension: v[2] })),
        ),
      );
    }, ROW_TAG);

  container
    .register(IAccumulatedDimension)
    .set(
      (c, ctx) =>
        new AccumulatedDimension(c.get(IItemDimension, COLUMN_TAG, ctx), c.get(ISheetConfig, ctx).get$('columnCount')),
      COLUMN_TAG,
    )
    .set(
      (c, ctx) =>
        new AccumulatedDimension(c.get(IItemDimension, ROW_TAG, ctx), c.get(ISheetConfig, ctx).get$('rowCount')),
      ROW_TAG,
    );

  container
    .register(ISheetDimension)
    .set(
      (c, ctx) =>
        new SheetDimension(
          c.get(ISheetConfig, ctx),
          c.get(IAccumulatedDimension, COLUMN_TAG, ctx),
          c.get(IAccumulatedDimension, ROW_TAG, ctx),
          c.get(IExcelEntrance, ctx),
        ),
    );

  container
    .register(IScrollOffset)
    .set((c, ctx) => new ScrollOffset(c.get(ISheetDimension, ctx), c.get(IExcelEntrance, ctx)));

  container
    .register(IItemBoundary)
    .set(
      (c, ctx) =>
        new ItemBoundary(c.get(IAccumulatedDimension, COLUMN_TAG, ctx), {
          scrollValue$: c.get(IScrollOffset, ctx).left$,
          frozenCount$: c.get(ISheetConfig, ctx).get$('frozenColumns'),
        }),
      COLUMN_TAG,
    )
    .set(
      (c, ctx) =>
        new ItemBoundary(c.get(IAccumulatedDimension, ROW_TAG, ctx), {
          scrollValue$: c.get(IScrollOffset, ctx).top$,
          frozenCount$: c.get(ISheetConfig, ctx).get$('frozenRows'),
        }),
      ROW_TAG,
    );

  container
    .register(ICellDimension)
    .set((c, ctx) => new CellDimension(c.get(IItemBoundary, COLUMN_TAG, ctx), c.get(IItemBoundary, ROW_TAG, ctx)));

  container
    .register(IDataRegion)
    .set(
      (c, ctx) =>
        new DataRegion(
          c.get(ISheetConfig, ctx),
          c.get(IItemBoundary, COLUMN_TAG, ctx),
          c.get(IItemBoundary, ROW_TAG, ctx),
          c.get(ISheetDimension, ctx),
        ),
    );
}
