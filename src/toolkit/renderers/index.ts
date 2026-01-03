import { container } from '../constants';
import { ISelectionStore } from '../events';
import { ICellDimension, IDataRegion, ISheetConfig, ISheetDimension } from '../helpers';

import { CellListener } from './cell';
import { RangeCollection } from './range';
import { SelectionListener } from './selection';
import { ICellListener, IRangeCollection, ISelectionListener } from './types';

export * from './types';

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
