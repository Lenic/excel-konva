import type { IContainer } from '../../container';

import { defaultSheetConfig, SheetConfig } from './config';
import { KONVA_CONTAINER, SCROLL_CONTAINER, UIElement, VIRTUAL_CONTENT } from './constants';
import { KonvaItems } from './konva-items';
import { ScrollOffset } from './offset';
import { IKonvaItems, IScrollOffset, ISheetConfig } from './types';

export * from './constants';
export * from './types';
export { defaultSheetConfig, SheetConfig };

/**
 * Add core class registrations to the container
 *
 * @param container - the target IOC container
 */
export function registerCore(container: IContainer, config: ISheetConfig) {
  container.register(ISheetConfig).set(() => config);

  container
    .register(UIElement)
    .set(() => document.getElementById('konva-container') as HTMLDivElement, KONVA_CONTAINER)
    .set(() => document.getElementById('scroll-container') as HTMLDivElement, SCROLL_CONTAINER)
    .set(() => document.getElementById('virtual-content') as HTMLDivElement, VIRTUAL_CONTENT);

  container.register(IScrollOffset).set((c, ctx) => new ScrollOffset(c.get(UIElement, SCROLL_CONTAINER, ctx)));

  container
    .register(IKonvaItems)
    .set(
      (c, ctx) =>
        new KonvaItems(
          c.get(UIElement, KONVA_CONTAINER, ctx),
          c.get(UIElement, SCROLL_CONTAINER, ctx),
          c.get(ISheetConfig, ctx),
        ),
    );
}
