import type { IContainer } from '../../container';

import { ISelectionStore } from '../events';
import { ICellDimension, IDataRegion, ISheetConfig, ISheetDimension } from '../helpers';

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

  container.register(ISelectionListener).set((c) => {
    return new SelectionListener(
      c.get(ISheetConfig),
      c.get(ISheetDimension),
      c.get(ICellDimension),
      c.get(ISelectionStore),
    );
  });

  container.register(ICellListener).set((c) => {
    return new CellListener(c.get(ISheetConfig), c.get(ICellDimension), c.get(IDataRegion));
  });
}
