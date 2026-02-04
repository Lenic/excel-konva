import type { IContainer } from '../../container';

import { IScrollOffset, ISheetConfig } from '../core';
import { KONVA_CONTAINER, UIElement } from '../core/constants';
import { COLUMN_TAG, IAccumulatedDimensionManager, ROW_TAG } from '../data';

import { SheetDimension } from './sheet-dimension';
import { ISheetDimension, IViewportManager } from './types';
import { ViewportManager } from './viewport';

export * from './types';

/**
 * Add UI class registrations to the container
 *
 * @param container - the target IOC container
 */
export function registerUI(container: IContainer) {
  container.register(UIElement).set(() => document.getElementById('konva-container')!, KONVA_CONTAINER);

  container.register(ISheetDimension).set((c, ctx) => new SheetDimension(c.get(UIElement, KONVA_CONTAINER, ctx)));
  container.register(IViewportManager).set((c, ctx) => {
    const config = c.get(ISheetConfig, ctx);
    return new ViewportManager(
      c.get(IScrollOffset, ctx),
      c.get(ISheetDimension, ctx),
      { frozenRowCount$: config.get$('frozenRows'), frozenColumnCount$: config.get$('frozenColumns') },
      c.get(IAccumulatedDimensionManager, ROW_TAG, ctx),
      c.get(IAccumulatedDimensionManager, COLUMN_TAG, ctx),
    );
  });
}
