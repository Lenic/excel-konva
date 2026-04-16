import type { IContainer } from '../../container';

import { IContentRenderer } from '../contents';
import { IKonvaItems, ISheetConfig } from '../core';
import { IDataManager } from '../data';
import { ISelectionStore } from '../events';
import { IRectPool, SELECTION_RECT_POOL } from '../pools';
import { ICellBoxManager, IViewportManager } from '../ui';

import { CellRenderer } from './cell-renderer';
import { SelectionRenderer } from './selection-renderer';
import { ShapeStyleConfig } from './shape-style';
import { ICellRenderer, ISelectionRenderer, IShapeStyleConfig } from './types';

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
      c.get(IKonvaItems, ctx).background,
      c.get(IDataManager, ctx),
      c.getAll(IContentRenderer, ctx),
    );
  });

  container.register(ISelectionRenderer).set((c, ctx) => {
    return new SelectionRenderer(
      c.get(ISelectionStore, ctx),
      c.get(IViewportManager, ctx),
      c.get(IKonvaItems, ctx).selection,
      c.get(IRectPool, SELECTION_RECT_POOL, ctx),
      c.get(ICellBoxManager, ctx),
      c.get(ISheetConfig, ctx),
    );
  });
}
