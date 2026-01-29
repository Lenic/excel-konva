import type { IContainer } from '../../container';

import Konva from 'konva';
import { map } from 'rxjs';

import { ISheetConfig } from '../helpers';
import { IExcelEntrance } from '../types';

import { ShapePool } from './shape-pool';
import { ICellTextPool, ISelectionLinePool, IShapePool } from './types';

export * from './types';

/**
 * Selection rect pool identifier
 */
export const SELECTION_RECT_POOL = Symbol('SELECTION_RECT_POOL');

/**
 * Active cell pool identifier
 */
export const ACTIVE_CELL_POOL = Symbol('ACTIVE_CELL_POOL');

/**
 * Register pools
 * @param container container
 */
export function registerPools(container: IContainer) {
  container
    .register(IShapePool)
    .set(
      (c, ctx) =>
        new ShapePool(
          c.get(IExcelEntrance, ctx).backgroundLayer,
          c.get(ISheetConfig, ctx).get$('defaultCellRectAttrs'),
          (attrs) => new Konva.Rect(attrs),
        ),
    )
    .set(
      (c, ctx) =>
        new ShapePool(
          c.get(IExcelEntrance, ctx).selectionLayer,
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
        new ShapePool(
          c.get(IExcelEntrance, ctx).selectionLayer,
          c.get(ISheetConfig, ctx).get$('activeCellRectAttrs'),
          (attrs) => new Konva.Rect(attrs),
        ),
      ACTIVE_CELL_POOL,
    );

  container.register(ISelectionLinePool).set(
    (c, ctx) =>
      new ShapePool(
        c.get(IExcelEntrance, ctx).selectionLayer,
        c
          .get(ISheetConfig, ctx)
          .get$('selectionRectAttrs')
          .pipe(map((attrs) => ({ ...attrs, fill: 'transparent' }))),
        (attrs) => new Konva.Line(attrs),
      ),
  );

  container
    .register(ICellTextPool)
    .set(
      (c, ctx) =>
        new ShapePool(
          c.get(IExcelEntrance, ctx).backgroundLayer,
          c.get(ISheetConfig, ctx).get$('defaultCellTextAttrs'),
          (attrs) => new Konva.Text(attrs),
        ),
    );
}
