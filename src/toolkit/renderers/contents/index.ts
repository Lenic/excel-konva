import type { IContainer } from '../../../container';

import { ICellDimension, ISheetConfig } from '../../helpers';
import { ICellPool } from '../../pools';
import { IExcelEntrance } from '../../types';

import { TextContentRenderer } from './text';
import { IContentRenderer } from './types';

export * from './types';

/**
 * Register content renderers
 *
 * @param container - Container
 */
export function registerContentRenderers(container: IContainer) {
  container.register(IContentRenderer).set((c, ctx) => {
    return new TextContentRenderer(
      c.get(ICellDimension, undefined, ctx),
      c.get(ICellPool, undefined, ctx),
      c.get(IExcelEntrance, undefined, ctx),
      c.get(ISheetConfig, undefined, ctx),
    );
  });
}
