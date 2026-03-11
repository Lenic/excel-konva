import type { IContainer } from '../../container';

import { IKonvaItems, ISheetConfig } from '../core';
import { IDataManager } from '../data';
import { ICursorListener } from '../events';
import { ICellTextPool, IRectPool } from '../pools';
import { ICellBoxManager, IViewportManager } from '../ui';

import { CellRenderer } from './cell-renderer';
import { ShapeStyleConfig } from './shape-style';
import { ICellRenderer, IShapeStyleConfig } from './types';

export * from './types';

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
      c.get(ICellBoxManager, ctx),
      c.get(IDataManager, ctx),
      c.get(IShapeStyleConfig, ctx),
      c.get(ICursorListener, ctx),
    );
  });
}
