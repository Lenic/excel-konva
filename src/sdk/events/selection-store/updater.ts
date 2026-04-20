import type { ILocation } from '../../core';
import type { ISelectionRegion, ISelectionRegionUpdater } from './types';
import type { TSelectionStoreAction } from './types.internal';

import { getDefaultValue, ObservableDisposable } from '../../utils';

/**
 * Coordinates live updates to a selection region, typically during mouse or pointer drag interactions.
 */
export class SelectionRegionUpdater extends ObservableDisposable implements ISelectionRegionUpdater {
  private readonly startLocation: ILocation;
  private region: ISelectionRegion;
  private callback: (action: TSelectionStoreAction) => void;

  constructor(startLocation: ILocation, callback: (action: TSelectionStoreAction) => void) {
    super();

    this.startLocation = startLocation;

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
    this.checkDisposed();

    this.region = {
      ...this.region,
      range: {
        rowStartIndex: Math.min(this.startLocation.rowIndex, endLocation.rowIndex),
        rowEndIndex: Math.max(this.startLocation.rowIndex, endLocation.rowIndex),
        columnStartIndex: Math.min(this.startLocation.columnIndex, endLocation.columnIndex),
        columnEndIndex: Math.max(this.startLocation.columnIndex, endLocation.columnIndex),
      },
    };
    this.callback({ type: 'update', region: this.region });
  }

  complete(): void {
    this.checkDisposed();

    this.callback({ type: 'distinct', id: this.region.id });

    this.dispose();
  }
}
