import type { IContainer } from '../../container';

import { IScrollOffset, ISheetConfig } from '../core';
import { KONVA_CONTAINER, UIElement } from '../core';
import { COLUMN_TAG, IAccumulatedDimensionManager, IDimensionManager, ROW_TAG } from '../data';

import { CellBoxManager } from './cell-box-manager';
import { FrozenInformation } from './frozen-information';
import { ScrollableRange } from './scrollable-range';
import { SheetDimension } from './sheet-dimension';
import { ICellBoxManager, IFrozenInformation, IScrollableRange, ISheetDimension, IViewportManager } from './types';
import { ViewportManager } from './viewport-manager';

export * from './types';

/**
 * Add UI class registrations to the container
 *
 * @param container - the target IOC container
 */
export function registerUI(container: IContainer) {
  container.register(ISheetDimension).set((c, ctx) => new SheetDimension(c.get(UIElement, KONVA_CONTAINER, ctx)));

  container.register(IFrozenInformation).set((c, ctx) => {
    const config = c.get(ISheetConfig, ctx);
    return new FrozenInformation(
      config.get$('frozenRows'),
      config.get$('frozenColumns'),
      c.get(IAccumulatedDimensionManager, ROW_TAG, ctx),
      c.get(IAccumulatedDimensionManager, COLUMN_TAG, ctx),
    );
  });

  container
    .register(IScrollableRange)
    .set(
      (c, ctx) =>
        new ScrollableRange(
          c.get(IFrozenInformation, ctx),
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
          c.get(IScrollableRange, ctx),
          c.get(IFrozenInformation, ctx),
        ),
    );

  container.register(ICellBoxManager).set((c, ctx) => {
    return new CellBoxManager(
      c.get(IDimensionManager, ROW_TAG, ctx),
      c.get(IDimensionManager, COLUMN_TAG, ctx),
      c.get(IAccumulatedDimensionManager, ROW_TAG, ctx),
      c.get(IAccumulatedDimensionManager, COLUMN_TAG, ctx),
    );
  });
}
