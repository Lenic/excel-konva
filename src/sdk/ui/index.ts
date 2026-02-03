import type { IContainer } from '../../container';

import { ScrollOffset } from './offset';
import { IScrollOffset } from './types';

export * from './types';

/**
 * Add UI class registrations to the container
 *
 * @param container - the target IOC container
 */
export function registerUI(container: IContainer) {
  container.register(IScrollOffset).set(() => new ScrollOffset(document.getElementById('konva-container')!));
}
