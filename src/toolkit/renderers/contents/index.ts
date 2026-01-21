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
  container
    .register(IContentRenderer)
    .set(
      (c, ctx) =>
        new TextContentRenderer(
          c.get(ICellDimension, ctx),
          c.get(ICellPool, ctx),
          c.get(IExcelEntrance, ctx),
          c.get(ISheetConfig, ctx),
        ),
    );
}
