import type { IContainer } from '../../container';

import { ISheetConfig } from '../core';

import { KONVA_CONTAINER, SCROLL_CONTAINER, UIElement, VIRTUAL_CONTENT } from './constants';
import { KonvaItems } from './konva-items';
import { IKonvaItems } from './types';

export * from './constants';
export * from './types';

/**
 * Add reference class registrations to the container
 *
 * @param container - the target IOC container
 */
export function registerReference(container: IContainer) {
  container
    .register(UIElement)
    .set(() => document.getElementById('konva-container') as HTMLDivElement, KONVA_CONTAINER)
    .set(() => document.getElementById('scroll-container') as HTMLDivElement, SCROLL_CONTAINER)
    .set(() => document.getElementById('virtual-content') as HTMLDivElement, VIRTUAL_CONTENT);

  container
    .register(IKonvaItems)
    .set(
      (c, ctx) => new KonvaItems(c.get(KONVA_CONTAINER, ctx), c.get(SCROLL_CONTAINER, ctx), c.get(ISheetConfig, ctx)),
    );
}
