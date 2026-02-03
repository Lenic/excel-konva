import type { IContainer } from '../../container';

import { KONVA_CONTAINER, UIElement } from './constants';
import { ScrollOffset } from './offset';
import { SheetDimension } from './sheet-dimension';
import { IScrollOffset, ISheetDimension } from './types';

export * from './types';

/**
 * Add UI class registrations to the container
 *
 * @param container - the target IOC container
 */
export function registerUI(container: IContainer) {
  container.register(UIElement).set(() => document.getElementById('konva-container')!, KONVA_CONTAINER);

  container.register(IScrollOffset).set((c, ctx) => new ScrollOffset(c.get(UIElement, KONVA_CONTAINER, ctx)));
  container.register(ISheetDimension).set((c, ctx) => new SheetDimension(c.get(UIElement, KONVA_CONTAINER, ctx)));
}
