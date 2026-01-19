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
    .set((c) => new RectPool(c.get(IExcelEntrance).selectionLayer, c.get(ISheetConfig).get$('selectionRectAttrs')));
  container
    .register(IActiveCellMarkerPool)
    .set((c) => new RectPool(c.get(IExcelEntrance).selectionLayer, c.get(ISheetConfig).get$('activeCellRectAttrs')));
  container
    .register(ICellPool)
    .set(
      (c) =>
        new CellPool(
          c.get(IExcelEntrance).backgroundLayer,
          c.get(ISheetConfig).get$('defaultCellRectAttrs'),
          c.get(ISheetConfig).get$('defaultCellTextAttrs'),
        ),
    );
}
