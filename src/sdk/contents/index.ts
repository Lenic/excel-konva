import type { IContainer } from '../../container';

import { IKonvaItems } from '../core';
import { IDataManager } from '../data';
import { ICursorListener } from '../events';
import { ICellTextPool, IRectPool } from '../pools';
import { IShapeStyleConfig } from '../renderers';

import { DefaultRectContentRenderer } from './default-rect-renderer';
import { DefaultTextContentRenderer } from './default-text-renderer';
import { HeaderTextContentRenderer } from './header-text-renderer';
import { IContentRenderer } from './types';

export * from './types';

/**
 * Registration token for the default text content renderer.
 */
export const DEFAULT_TEXT = Symbol('DEFAULT_TEXT');

/**
 * Registration token for the header text content renderer.
 */
export const HEADER_TEXT = Symbol('HEADER_TEXT');

/**
 * Registers various content renderers into the dependency injection container.
 *
 * @param container - The application's dependency injection container.
 */
export function registerContents(container: IContainer) {
  container
    .register(IContentRenderer)
    .set((c, ctx) => new DefaultRectContentRenderer(c.get(IShapeStyleConfig, ctx), c.get(IRectPool, ctx)))
    .set(
      (c, ctx) =>
        new DefaultTextContentRenderer(
          c.get(IKonvaItems, ctx),
          c.get(IDataManager, ctx),
          c.get(IShapeStyleConfig, ctx),
          c.get(ICursorListener, ctx),
          c.get(ICellTextPool, ctx),
        ),
      DEFAULT_TEXT,
    )
    .set(
      (c, ctx) => new HeaderTextContentRenderer(c.get(IShapeStyleConfig, ctx), c.get(ICellTextPool, ctx)),
      HEADER_TEXT,
    );
}
