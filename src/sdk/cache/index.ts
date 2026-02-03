import type { IContainer } from '../../container';

import { ISheetConfig } from '../core';
import { COLUMN_TAG, IDimensionManager, ROW_TAG } from '../data';

import { AccumulatedDimensionManager } from './accumulation';
import { IAccumulatedDimensionManager } from './types';

export * from './types';

/**
 * Add cache class registrations to the container
 *
 * @param container - the target IOC container
 */
export function registerCache(container: IContainer) {
  container
    .register(IAccumulatedDimensionManager)
    .set(
      (c, ctx) =>
        new AccumulatedDimensionManager(
          c.get(IDimensionManager, ROW_TAG, ctx),
          c.get(ISheetConfig, ctx).get$('rowCount'),
        ),
      ROW_TAG,
    )
    .set(
      (c, ctx) =>
        new AccumulatedDimensionManager(
          c.get(IDimensionManager, COLUMN_TAG, ctx),
          c.get(ISheetConfig, ctx).get$('columnCount'),
        ),
      COLUMN_TAG,
    );
}
