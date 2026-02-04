import type { IDisposable, TIdentifier } from '../../container';
import type { ICellRange, IChangePatch } from '../core';
import type { Observable } from 'rxjs';

/**
 * Configuration options for row or column dimensions.
 */
export interface IDimensionOptions {
  /**
   * The minimum allowed dimension size (e.g., minimum row height or column width).
   */
  minimalDimension: number;
  /**
   * The default dimension size for headers (index 0).
   */
  headerDimension: number;
  /**
   * The default dimension size for all other indices.
   */
  defaultDimension: number;
}

/**
 * Represents a change in a single dimension (row or column).
 */
export interface IDimensionChangePatch extends IChangePatch {
  /**
   * The index of the row or column being changed.
   */
  index: number;
}

/**
 * Interface for managing row or column dimensions.
 */
export interface IDimensionManager extends IDisposable {
  /**
   * An observable that emits when a dimension value changes.
   */
  readonly change$: Observable<IDimensionChangePatch>;

  /**
   * Retrieves the dimension size for a specific index.
   *
   * @param index - The row or column index.
   */
  get(index: number): number;

  /**
   * Sets the dimension size for a specific index.
   *
   * @param index - The row or column index.
   * @param value - The new dimension size. If undefined, it resets to the default value.
   */
  set(index: number, value?: number): void;
}
/**
 * Identifier for the IDimensionManager interface.
 */
export const IDimensionManager: TIdentifier<IDimensionManager> = Symbol('IDimensionManager');

/**
 * Accumulated dimension of items
 */
export interface IAccumulatedDimensionManager {
  /**
   * An observable that emits when a dimension value changes.
   */
  readonly change$: Observable<IDimensionChangePatch>;

  /**
   * Get accumulated dimension
   *
   * - The accumulated dimension of the first item is 0
   *
   * @param index - Item index
   * @returns Accumulated dimension
   */
  get(index: number): number;
  /**
   * Find index by accumulated dimension
   *
   * @param offset - Accumulated dimension
   * @returns Item index
   */
  findIndex(offset: number): number;
}
export const IAccumulatedDimensionManager: TIdentifier<IAccumulatedDimensionManager> =
  Symbol('IAccumulatedDimensionManager');

/**
 * Patch representing a command to clear cell values within a specific range.
 */
export interface IClearCellValuePatch {
  /**
   * The type of patch, set to 'clear'.
   */
  type: 'clear';
  /**
   * The cell range to be cleared.
   */
  range: ICellRange;
}

/**
 * Patch representing a command to set cell values within a specific range.
 */
export interface ISetCellValuePatch<T = unknown> {
  /**
   * The type of patch, set to 'set'.
   */
  type: 'set';
  /**
   * The 2D array of values to be applied to the range.
   */
  values: T[][];
  /**
   * The cell range where values will be set.
   */
  range: ICellRange;
}

export interface IItemCountPatch extends IChangePatch {
  type: 'row' | 'column';
}

/**
 * Union type for cell data change patches.
 */
export type TCellChangePatch<T = unknown> = IClearCellValuePatch | ISetCellValuePatch<T> | IItemCountPatch;

/**
 * Interface for providing and managing spreadsheet cell data.
 */
export interface IDataManager<T = unknown> extends IDisposable {
  /**
   * An observable that emits patches representing incremental changes to the data source.
   */
  readonly patch$: Observable<TCellChangePatch<T>>;

  /**
   * Retrieves the value of a cell at the specified row and column indices.
   *
   * @param rowIndex - The index of the row.
   * @param columnIndex - The index of the column.
   *
   * @returns The cell value, or null if empty.
   */
  getCellValue(rowIndex: number, columnIndex: number): T | null;

  /**
   * Gets the total number of rows in the data source.
   */
  getRowCount(): number;

  /**
   * Gets the total number of columns in the data source.
   */
  getColumnCount(): number;
}
