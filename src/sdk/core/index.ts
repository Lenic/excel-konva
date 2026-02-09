import type { IContainer } from '../../container';

import { KONVA_CONTAINER, UIElement } from '../reference';

import { ScrollOffset } from './offset';
import { defaultSheetConfig, SheetConfig } from './sheetConfig';
import { IScrollOffset, ISheetConfig } from './types';

export * from './types';
export { defaultSheetConfig, SheetConfig };

/**
 * Add core class registrations to the container
 *
 * @param container - the target IOC container
 */
export function registerCore(container: IContainer, config: ISheetConfig) {
  container.register(ISheetConfig).set(() => config);

  container.register(IScrollOffset).set((c, ctx) => new ScrollOffset(c.get(UIElement, KONVA_CONTAINER, ctx)));
}
