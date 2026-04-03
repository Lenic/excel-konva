import type { ILocation } from '../../core';
import type { ISelectionRegion, ISelectionRegionUpdater } from './types';
import type { TSelectionStoreAction } from './types.internal';

import { getDefaultValue, ObservableDisposable } from '../../utils';

/**
 * Handles live updates to a selection region during mouse interaction.
 */
export class SelectionRegionUpdater extends ObservableDisposable implements ISelectionRegionUpdater {
  private readonly startLocation: ILocation;
  private region: ISelectionRegion;
  private callback: (action: TSelectionStoreAction) => void;

  /**
   * Initializes a new selection updater.
   * @param startLocation - The initial point where the selection started.
   * @param callback - Function to notify the store of region changes.
   */
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

  /**
   * Updates the selection range based on the new end coordinates.
   * @param endLocation - The current mouse/pointer location during dragging.
   */
  update(endLocation: ILocation): void {
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

  /**
   * Finalizes the selection and triggers redundancy checks.
   */
  complete(): void {
    this.callback({ type: 'distinct', id: this.region.id });
  }
}
