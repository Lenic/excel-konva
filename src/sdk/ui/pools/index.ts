import type { IContainer } from '../../../container';

import Konva from 'konva';
import { map } from 'rxjs';

import { ISheetConfig } from '../../core';
import { IKonvaItems } from '../../reference';

import { ShapePool } from './shape-pool';
import { ICellTextPool, IRectPool } from './types';

/**
 * Symbol for selection rectangle pool
 */
export const SELECTION_RECT_POOL = Symbol('SELECTION_RECT_POOL');

/**
 * Symbol for active cell rectangle pool
 */
export const ACTIVE_CELL_POOL = Symbol('ACTIVE_CELL_POOL');

/**
 * Symbol for active cell boundary line pool
 */
export const ACTIVE_CELL_LINE_POOL = Symbol('ACTIVE_CELL_LINE_POOL');

/**
 * Registers pool-related services in the DI container
 *
 * @param container - The target IOC container
 */
export function registerPools(container: IContainer) {
  container
    .register(IRectPool)
    .set(
      (c, ctx) =>
        new ShapePool<Konva.RectConfig, Konva.Rect>(
          c.get(IKonvaItems, ctx).background.layer,
          c.get(ISheetConfig, ctx).get$('defaultCellRectAttrs'),
          (attrs) => new Konva.Rect(attrs),
        ),
    )
    .set(
      (c, ctx) =>
        new ShapePool<Konva.RectConfig, Konva.Rect>(
          c.get(IKonvaItems, ctx).selection.layer,
          c
            .get(ISheetConfig, ctx)
            .get$('selectionRectAttrs')
            .pipe(map((attrs) => ({ ...attrs, stroke: 'transparent', strokeWidth: 0 }))),
          (attrs) => new Konva.Rect(attrs),
        ),
      SELECTION_RECT_POOL,
    )
    .set(
      (c, ctx) =>
        new ShapePool<Konva.RectConfig, Konva.Rect>(
          c.get(IKonvaItems, ctx).selection.layer,
          c
            .get(ISheetConfig, ctx)
            .get$('activeCellRectAttrs')
            .pipe(map((attrs) => ({ ...attrs, stroke: 'transparent', strokeWidth: 0 }))),
          (attrs) => new Konva.Rect(attrs),
        ),
      ACTIVE_CELL_POOL,
    );

  container
    .register(ICellTextPool)
    .set(
      (c, ctx) =>
        new ShapePool<Konva.TextConfig, Konva.Text>(
          c.get(IKonvaItems, ctx).background.layer,
          c.get(ISheetConfig, ctx).get$('defaultCellTextAttrs'),
          (attrs) => new Konva.Text(attrs),
        ),
    );
}
