import { container } from '../constants';
import { ISelectionStore } from '../events';
import { ICellDimension, IDataRegion, ISheetConfig, ISheetDimension } from '../helpers';

import { CellListener } from './cell';
import { SelectionListener } from './selection';
import { ICellListener, ISelectionListener } from './types';

export * from './types';

container.set(ISelectionListener).set((c) => {
  return new SelectionListener(
    c.get(ISheetConfig),
    c.get(ISheetDimension),
    c.get(ICellDimension),
    c.get(ISelectionStore),
  );
});

container.set(ICellListener).set((c) => {
  return new CellListener(c.get(ISheetConfig), c.get(ICellDimension), c.get(IDataRegion));
});
