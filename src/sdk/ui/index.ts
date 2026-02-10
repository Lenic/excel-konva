import type { IContainer } from '../../container';

import { IScrollOffset, ISheetConfig } from '../core';
import { COLUMN_TAG, IAccumulatedDimensionManager, IDataManager, IDimensionManager, ROW_TAG } from '../data';
import { IKonvaItems, KONVA_CONTAINER, UIElement } from '../reference';

import { ICellTextPool, IRectPool } from './pools/types';
import { CellRenderer } from './renderers/cell-renderer';
import { ShapeStyleConfig } from './renderers/shape-style';
import { ICellRenderer, IShapeStyleConfig } from './renderers/types';
import { LayoutCache } from './layout-cache';
import { registerPools } from './pools';
import { SheetDimension } from './sheet-dimension';
import { ILayoutCache, ISheetDimension, IViewportManager } from './types';
import { ViewportManager } from './viewport-manager';

export * from './pools/types';
export * from './renderers/types';
export * from './types';

/**
 * Add UI class registrations to the container
 *
 * @param container - the target IOC container
 */
export function registerUI(container: IContainer) {
  registerPools(container);

  container.register(ISheetDimension).set((c, ctx) => new SheetDimension(c.get(UIElement, KONVA_CONTAINER, ctx)));

  container.register(IViewportManager).set((c, ctx) => {
    const config = c.get(ISheetConfig, ctx);
    return new ViewportManager(
      c.get(IScrollOffset, ctx),
      c.get(ISheetDimension, ctx),
      {
        frozenRowCount$: config.get$('frozenRows'),
        frozenColumnCount$: config.get$('frozenColumns'),
      },
      c.get(IAccumulatedDimensionManager, ROW_TAG, ctx),
      c.get(IAccumulatedDimensionManager, COLUMN_TAG, ctx),
    );
  });

  container.register(ILayoutCache).set((c, ctx) => {
    return new LayoutCache(
      c.get(IDimensionManager, ROW_TAG, ctx),
      c.get(IDimensionManager, COLUMN_TAG, ctx),
      c.get(IAccumulatedDimensionManager, ROW_TAG, ctx),
      c.get(IAccumulatedDimensionManager, COLUMN_TAG, ctx),
    );
  });
}

/**
 * Add renderer registrations to the container
 *
 * @param container - the target IOC container
 */
export function registerRenderers(container: IContainer) {
  container.register(IShapeStyleConfig).set((c, ctx) => {
    return new ShapeStyleConfig(c.get(ISheetConfig, ctx));
  });

  container.register(ICellRenderer).set((c, ctx) => {
    return new CellRenderer(
      c.get(IViewportManager, ctx),
      c.get(IKonvaItems, ctx),
      c.get(IRectPool, ctx),
      c.get(ICellTextPool, ctx),
      c.get(ILayoutCache, ctx),
      c.get(IDataManager, ctx),
      c.get(IShapeStyleConfig, ctx),
    );
  });
}
