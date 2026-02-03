import type { IContainer } from '../../container';

import { combineLatest, map } from 'rxjs';

import { ISheetConfig } from '../core';

import { DimensionManager } from './dimension';
import { IDimensionManager } from './types';

export * from './types';

/**
 * The tag for the row dimension manager
 */
export const ROW_TAG = Symbol('ROW_TAG');

/**
 * The tag for the column dimension manager
 */
export const COLUMN_TAG = Symbol('COLUMN_TAG');

/**
 * Add data class registrations to the container
 *
 * @param container - the target IOC container
 */
export function registerData(container: IContainer) {
  container
    .register(IDimensionManager)
    .set((c, ctx) => {
      const config = c.get(ISheetConfig, ctx);
      return new DimensionManager(
        combineLatest([config.get$('minimalRowHeight'), config.get$('headerHeight'), config.get$('rowHeight')]).pipe(
          map((v) => ({ minimalDimension: v[0], headerDimension: v[1], defaultDimension: v[2] })),
        ),
      );
    }, ROW_TAG)
    .set((c, ctx) => {
      const config = c.get(ISheetConfig, ctx);
      return new DimensionManager(
        combineLatest([config.get$('minimalColumnWidth'), config.get$('headerWidth'), config.get$('columnWidth')]).pipe(
          map((v) => ({ minimalDimension: v[0], headerDimension: v[1], defaultDimension: v[2] })),
        ),
      );
    }, COLUMN_TAG);
}
