import type { IContainer } from '../../container';

import { IContentManager } from '../contents';
import { ISelectionStore } from '../events';
import { ICellDimension, IDataRegion, ISheetConfig, ISheetDimension } from '../helpers';
import { IActiveCellMarkerPool, ISelectionPool } from '../pools';
import { IExcelEntrance } from '../types';

import { CellListener } from './cell';
import { RangeCollection } from './range';
import { SelectionListener } from './selection';
import { ICellListener, IRangeCollection, ISelectionListener } from './types';

export * from './types';

/**
 * Add renderer registrations to the container
 *
 * @param container - the target IOC container
 */
export function registerRenderers(container: IContainer) {
  container.register(IRangeCollection, 'transient').set(() => new RangeCollection());

  container
    .register(ISelectionListener)
    .set(
      (c, ctx) =>
        new SelectionListener(
          c.get(ISheetConfig, ctx),
          c.get(ISheetDimension, ctx),
          c.get(ICellDimension, ctx),
          c.get(ISelectionStore, ctx),
          c.get(IExcelEntrance, ctx),
          c.get(ISelectionPool, ctx),
          c.get(IActiveCellMarkerPool, ctx),
        ),
    );

  container
    .register(ICellListener)
    .set(
      (c, ctx) =>
        new CellListener(
          c.get(IExcelEntrance, ctx).backgroundLayer,
          c.get(ISheetConfig, ctx),
          c.get(IDataRegion, ctx),
          c.get(ICellDimension, ctx),
          c.getAll(IContentManager, ctx),
        ),
    );
}
