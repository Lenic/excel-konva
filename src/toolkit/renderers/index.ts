import type { IContainer } from '../../container';

import { ISelectionStore } from '../events';
import { ICellDimension, IDataRegion, ISheetConfig, ISheetDimension } from '../helpers';
import { IActiveCellMarkerPool, ISelectionPool } from '../pools';
import { IExcelEntrance } from '../types';

import { CellListener } from './cell';
import { IContentRenderer, registerContentRenderers } from './contents';
import { RangeCollection } from './range';
import { SelectionListener } from './selection';
import { ICellListener, IRangeCollection, ISelectionListener } from './types';

export * from './contents';
export * from './types';

/**
 * Add renderer registrations to the container
 *
 * @param container - the target IOC container
 */
export function registerRenderers(container: IContainer) {
  container.register(IRangeCollection, 'transient').set(() => new RangeCollection());

  registerContentRenderers(container);

  container.register(ISelectionListener).set((c) => {
    return new SelectionListener(
      c.get(ISheetConfig),
      c.get(ISheetDimension),
      c.get(ICellDimension),
      c.get(ISelectionStore),
      c.get(IExcelEntrance),
      c.get(ISelectionPool),
      c.get(IActiveCellMarkerPool),
    );
  });

  container.register(ICellListener).set((c) => {
    return new CellListener(
      c.get(IExcelEntrance).backgroundLayer,
      c.get(ISheetConfig),
      c.get(IDataRegion),
      c.get(ICellDimension),
      c.getAll(IContentRenderer),
    );
  });
}
