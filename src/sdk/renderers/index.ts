import type { IContainer } from '../../container';

import { IContentRenderer } from '../contents';
import { IKonvaItems, ISheetConfig } from '../core';
import { IDataManager } from '../data';
import { ICellBoxManager, IViewportManager } from '../ui';

import { CellRenderer } from './cell-renderer';
import { ShapeStyleConfig } from './shape-style';
import { ICellRenderer, IShapeStyleConfig } from './types';

export * from './types';

/**
 * Adds renderer registrations to the dependency injection container.
 *
 * @param container - The target IOC container to register renderers into.
 */
export function registerRenderers(container: IContainer) {
  container.register(IShapeStyleConfig).set((c, ctx) => {
    return new ShapeStyleConfig(c.get(ISheetConfig, ctx));
  });

  container.register(ICellRenderer).set((c, ctx) => {
    return new CellRenderer(
      c.get(ICellBoxManager, ctx),
      c.get(IViewportManager, ctx),
      c.get(IKonvaItems, ctx),
      c.get(IDataManager, ctx),
      c.getAll(IContentRenderer, ctx),
    );
  });
}
