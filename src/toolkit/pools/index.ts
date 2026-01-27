import type { IContainer } from '../../container';

import Konva from 'konva';
import { map } from 'rxjs';

import { ISheetConfig } from '../helpers';
import { IExcelEntrance } from '../types';

import { CellPool } from './cell-pool';
import { ShapePool } from './shape-pool';
import { IActiveCellMarkerPool, ICellPool, ISelectionLinePool, ISelectionPool } from './types';

export * from './types';

export function registerPools(container: IContainer) {
  container.register(ISelectionPool).set(
    (c, ctx) =>
      new ShapePool(
        c.get(IExcelEntrance, ctx).selectionLayer,
        c
          .get(ISheetConfig, ctx)
          .get$('selectionRectAttrs')
          .pipe(map((attrs) => ({ ...attrs, stroke: 'transparent', strokeWidth: 0 }))),
        (attrs) => new Konva.Rect(attrs),
      ),
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
    .register(IActiveCellMarkerPool)
    .set(
      (c, ctx) =>
        new ShapePool(
          c.get(IExcelEntrance, ctx).selectionLayer,
          c.get(ISheetConfig, ctx).get$('activeCellRectAttrs'),
          (attrs) => new Konva.Rect(attrs),
        ),
    );
  container
    .register(ICellPool)
    .set(
      (c, ctx) =>
        new CellPool(
          c.get(IExcelEntrance, ctx).backgroundLayer,
          c.get(ISheetConfig, ctx).get$('defaultCellRectAttrs'),
          c.get(ISheetConfig, ctx).get$('defaultCellTextAttrs'),
        ),
    );
}
