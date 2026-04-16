import type { IContainer } from '../../container';

import { IScrollOffset, ISheetConfig } from '../core';
import { KONVA_CONTAINER, UIElement } from '../core';
import { COLUMN_TAG, IAccumulatedDimensionManager, IDimensionManager, ROW_TAG } from '../data';

import { CellBoxManager } from './cell-box-manager';
import { FrozenInformationManager } from './frozen-information-manager';
import { ScrollableRangeManager } from './scrollable-range-manager';
import { SheetDimension } from './sheet-dimension';
import {
  ICellBoxManager,
  IFrozenInformationManager,
  IScrollableRangeManager,
  ISheetDimension,
  IViewportManager,
} from './types';
import { ViewportManager } from './viewport-manager';

export * from './types';

/**
 * Standardizes UI registrations within the application's dependency injection container.
 *
 * @param container - The target dependency injection container.
 */
export function registerUI(container: IContainer) {
  container.register(ISheetDimension).set((c, ctx) => new SheetDimension(c.get(UIElement, KONVA_CONTAINER, ctx)));

  container.register(IFrozenInformationManager).set((c, ctx) => {
    const config = c.get(ISheetConfig, ctx);
    return new FrozenInformationManager(
      config.get$('frozenRows'),
      config.get$('frozenColumns'),
      c.get(IAccumulatedDimensionManager, ROW_TAG, ctx),
      c.get(IAccumulatedDimensionManager, COLUMN_TAG, ctx),
    );
  });

  container
    .register(IScrollableRangeManager)
    .set(
      (c, ctx) =>
        new ScrollableRangeManager(
          c.get(IFrozenInformationManager, ctx),
          c.get(IScrollOffset, ctx),
          c.get(ISheetDimension, ctx),
          c.get(IAccumulatedDimensionManager, ROW_TAG, ctx),
          c.get(IAccumulatedDimensionManager, COLUMN_TAG, ctx),
        ),
    );

  container
    .register(IViewportManager)
    .set(
      (c, ctx) =>
        new ViewportManager(
          c.get(IScrollOffset, ctx),
          c.get(ISheetDimension, ctx),
          c.get(IScrollableRangeManager, ctx),
          c.get(IFrozenInformationManager, ctx),
        ),
    );

  container.register(ICellBoxManager).set((c, ctx) => {
    return new CellBoxManager(
      c.get(IAccumulatedDimensionManager, ROW_TAG, ctx),
      c.get(IAccumulatedDimensionManager, COLUMN_TAG, ctx),
    );
  });
}
