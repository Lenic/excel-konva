import type { ILocation } from '../../core';
import type { ISelectionRegion, ISelectionRegionUpdater } from './types';
import type { TSelectionStoreAction } from './types.internal';

import { getDefaultValue, ObservableDisposable } from '../../utils';

export class SelectionRegionUpdater extends ObservableDisposable implements ISelectionRegionUpdater {
  private region: ISelectionRegion;
  private callback: (action: TSelectionStoreAction) => void;

  constructor(startLocation: ILocation, callback: (action: TSelectionStoreAction) => void) {
    super();

    this.callback = callback;
    this.disposeWithMe(() => void (this.callback = getDefaultValue<(action: TSelectionStoreAction) => void>()));

    this.region = {
      id: Date.now(),
      range: {
        rowStartIndex: startLocation.rowIndex,
        rowEndIndex: startLocation.rowIndex,
        columnStartIndex: startLocation.columnIndex,
        columnEndIndex: startLocation.columnIndex,
      },
      activeCell: startLocation,
    };
    this.disposeWithMe(() => void (this.region = getDefaultValue<ISelectionRegion>()));

    callback({ type: 'add', region: this.region });
  }

  update(endLocation: ILocation): void {
    this.region = {
      ...this.region,
      range: {
        rowStartIndex: Math.min(this.region.range.rowStartIndex, endLocation.rowIndex),
        rowEndIndex: Math.max(this.region.range.rowEndIndex, endLocation.rowIndex),
        columnStartIndex: Math.min(this.region.range.columnStartIndex, endLocation.columnIndex),
        columnEndIndex: Math.max(this.region.range.columnEndIndex, endLocation.columnIndex),
      },
    };
    this.callback({ type: 'update', region: this.region });
  }

  complete(): void {
    this.callback({ type: 'distinct', id: this.region.id });
  }
}
