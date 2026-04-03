import type { IDisposable, TIdentifier } from '../../../container';
import type { ICellRange, IChangePatch, IChangeTracker, ILocation } from '../../core';

/**
 * Represents a single selection region within the worksheet.
 */
export interface ISelectionRegion {
  /**
   * Unique identifier of the selection region.
   */
  id: number;
  /**
   * Cell range of the selection.
   */
  range: ICellRange;
  /**
   * Current active cell location within the selection.
   */
  activeCell: ILocation;
}

/**
 * Handles live updates to a selection region during an ongoing selection operation.
 */
export interface ISelectionRegionUpdater extends IDisposable {
  /**
   * Updates the endpoint of the selection.
   * @param endLocation - The new endpoint coordinates.
   */
  update(endLocation: ILocation): void;
  /**
   * Finalizes the current selection operation.
   */
  complete(): void;
}

/**
 * Patch emitted when a new selection region is added.
 */
export interface ISelectionRegionAddPatch {
  /**
   * Distinguishes the patch type as an addition.
   */
  type: 'add';
  /**
   * The selection region that was added.
   */
  region: ISelectionRegion;
}

/**
 * Patch emitted when a selection region is removed.
 */
export interface ISelectionRegionRemovePatch {
  /**
   * Distinguishes the patch type as a removal.
   */
  type: 'remove';
  /**
   * The selection region that was removed.
   */
  region: ISelectionRegion;
}

/**
 * Patch emitted when the entire selection list is reset or replaced.
 */
export interface ISelectionRegionResetPatch extends IChangePatch<ISelectionRegion[]> {
  /**
   * Distinguishes the patch type as a reset.
   */
  type: 'reset';
}

/**
 * Patch emitted when an existing selection region is updated.
 */
export interface ISelectionRegionUpdatePatch extends IChangePatch<ISelectionRegion> {
  /**
   * Distinguishes the patch type as an update.
   */
  type: 'update';
}

/**
 * Composite type defining all valid variations of selection region change patches.
 */
export type TSelectionRegionChangePatch =
  | ISelectionRegionAddPatch
  | ISelectionRegionUpdatePatch
  | ISelectionRegionRemovePatch
  | ISelectionRegionResetPatch;

/**
 * Manages and tracks multiple selection regions within the application.
 */
export interface ISelectionStore extends IDisposable, IChangeTracker<TSelectionRegionChangePatch> {
  /**
   * Current active selection regions.
   */
  value: ISelectionRegion[];
  /**
   * Creates a new selection region beginning at the specified location.
   * @param startLocation - Starting point of the selection.
   * @param isMultiSelect - Whether to append to or replace existing selections.
   */
  create(startLocation: ILocation, isMultiSelect: boolean): ISelectionRegionUpdater;
  /**
   * Resets the store with a new set of regions.
   * @param regions - Optional new regions; defaults to an empty list.
   */
  reset(regions?: ISelectionRegion[]): void;
}
/**
 * Dependency injection identifier for the selection store.
 */
export const ISelectionStore: TIdentifier<ISelectionStore> = Symbol('ISelectionStore');
