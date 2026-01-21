import type { IContainer } from '../../container';

import { ICellDimension, IScrollOffset, ISheetConfig } from '../helpers';
import { ICellPool } from '../pools';
import { IExcelEntrance } from '../types';

import { TextContentRenderer } from './text';
import { IContentManager } from './types';

export * from './types';

/**
 * Register content managers
 *
 * @param container - Container
 */
export function registerContentManagers(container: IContainer) {
  container
    .register(IContentManager)
    .set(
      (c, ctx) =>
        new TextContentRenderer(
          c.get(ICellDimension, ctx),
          c.get(ICellPool, ctx),
          c.get(IExcelEntrance, ctx),
          c.get(ISheetConfig, ctx),
          c.get(IScrollOffset, ctx),
        ),
    );
}
