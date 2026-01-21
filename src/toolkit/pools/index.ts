import type { IContainer } from '../../container';

import { ISheetConfig } from '../helpers';
import { IExcelEntrance } from '../types';

import { CellPool } from './cell-pool';
import { RectPool } from './rect-pool';
import { IActiveCellMarkerPool, ICellPool, ISelectionPool } from './types';

export * from './types';

export function registerPools(container: IContainer) {
  container
    .register(ISelectionPool)
    .set(
      (c, ctx) =>
        new RectPool(c.get(IExcelEntrance, ctx).selectionLayer, c.get(ISheetConfig, ctx).get$('selectionRectAttrs')),
    );
  container
    .register(IActiveCellMarkerPool)
    .set(
      (c, ctx) =>
        new RectPool(c.get(IExcelEntrance, ctx).selectionLayer, c.get(ISheetConfig, ctx).get$('activeCellRectAttrs')),
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
