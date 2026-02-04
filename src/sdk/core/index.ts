import type { IContainer } from '../../container';

import { KONVA_CONTAINER, UIElement } from './constants';
import { ScrollOffset } from './offset';
import { IScrollOffset } from './types';

export * from './disposable';
export * from './queue';
export * from './truncatable-list';
export * from './types';
export * from './utils';

/**
 * Add core class registrations to the container
 *
 * @param container - the target IOC container
 */
export function registerCore(container: IContainer) {
  container.register(IScrollOffset).set((c, ctx) => new ScrollOffset(c.get(UIElement, KONVA_CONTAINER, ctx)));
}
