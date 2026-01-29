import type { IContainer } from '../../container';

import { IContentManager } from '../contents';
import { ISelectionStore } from '../events';
import { COLUMN_TAG, IAccumulatedDimension, ICellDimension, IDataRegion, ISheetConfig, ROW_TAG } from '../helpers';
import { ACTIVE_CELL_LINE_POOL, ACTIVE_CELL_POOL, ILinePool, IShapePool, SELECTION_RECT_POOL } from '../pools';
import { IExcelEntrance } from '../types';

import { CellListener } from './cell';
import { RangeCollection } from './range';
import { SelectionListener } from './selections';
import { ICellListener, IRangeCollection, ISelectionListener } from './types';

export * from './types';

/**
 * Add renderer registrations to the container
 *
 * @param container - the target IOC container
 */
export function registerRenderers(container: IContainer) {
  container.register(IRangeCollection, 'transient').set(() => new RangeCollection());

  container
    .register(ISelectionListener)
    .set(
      (c, ctx) =>
        new SelectionListener(
          c.get(ISheetConfig, ctx),
          c.get(IAccumulatedDimension, ROW_TAG, ctx),
          c.get(IAccumulatedDimension, COLUMN_TAG, ctx),
          c.get(ICellDimension, ctx),
          c.get(IShapePool, SELECTION_RECT_POOL, ctx),
          c.get(ISelectionStore, ctx),
          c.get(IExcelEntrance, ctx),
          c.get(ILinePool, ctx),
          c.get(IShapePool, ACTIVE_CELL_POOL, ctx),
          c.get(ILinePool, ACTIVE_CELL_LINE_POOL, ctx),
        ),
    );

  container
    .register(ICellListener)
    .set(
      (c, ctx) =>
        new CellListener(
          c.get(ISheetConfig, ctx),
          c.get(IDataRegion, ctx),
          c.get(ICellDimension, ctx),
          c.getAll(IContentManager, ctx),
        ),
    );
}
