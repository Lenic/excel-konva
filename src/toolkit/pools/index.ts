import type { IContainer } from '../../container';

import { SELECTION_FILL_COLOR, SELECTION_STROKE_COLOR } from '../constants';
import { IExcelEntrance } from '../types';

import { CellPool } from './cell-pool';
import { RectPool } from './rect-pool';
import { IActiveCellMarkerPool, ICellPool, ISelectionPool } from './types';

export * from './types';

export function registerPools(container: IContainer) {
  container.register(ISelectionPool).set(
    (c) =>
      new RectPool(c.get(IExcelEntrance).selectionLayer, {
        fill: SELECTION_FILL_COLOR,
        stroke: SELECTION_STROKE_COLOR,
        strokeWidth: 2,
      }),
  );
  container.register(IActiveCellMarkerPool).set(
    (c) =>
      new RectPool(c.get(IExcelEntrance).selectionLayer, {
        stroke: '#10B981',
        strokeWidth: 3,
        fill: 'rgba(255, 255, 255, 0.7)',
      }),
  );
  container.register(ICellPool).set(
    (c) =>
      new CellPool(
        c.get(IExcelEntrance).backgroundLayer,
        {
          fill: '#ffffff',
          stroke: '#e8e8e8',
          strokeWidth: 0.5,
        },
        {
          fontSize: 12,
          fontFamily: 'Inter, Arial, sans-serif',
          fill: '#333333',
          verticalAlign: 'middle',
          padding: 8,
          listening: false,
          align: 'left',
          ellipsis: true,
          wrap: 'none',
        },
      ),
  );
}
