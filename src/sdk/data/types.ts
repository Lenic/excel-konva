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
   * The type of patch, set to 'dimension'.
   */
  type: 'dimension';
  /**
   * The index of the row or column being changed.
   */
  index: number;
}

/**
 * Represents a change in the dimension options.
 */
export interface IDimensionOptionsChangePatch extends IChangePatch<IDimensionOptions> {
  /**
   * The type of patch, set to 'options'.
   */
  type: 'options';
}

/**
 * Union type for dimension change patches.
 */
export type TDimensionPatch = IDimensionChangePatch | IDimensionOptionsChangePatch;

/**
 * Interface for managing row or column dimensions.
 */
export interface IDimensionManager extends IDisposable {
  /**
   * An observable that emits when a dimension value changes.
   */
  readonly change$: Observable<TDimensionPatch>;

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
 * Represents a change in the accumulated dimension count.
 */
export interface TAccumulatedDimensionCountChangePatch extends IChangePatch {
  /**
   * The type of patch, set to 'count'.
   */
  type: 'count';
}

/**
 * Union type for accumulated dimension change patches.
 */
export type TAccumulatedDimensionPatch = TDimensionPatch | TAccumulatedDimensionCountChangePatch;

/**
 * Accumulated dimension of items
 */
export interface IAccumulatedDimensionManager {
  /**
   * An observable that emits when a dimension value changes.
   */
  readonly change$: Observable<TAccumulatedDimensionPatch>;

  /**
   * Get the accumulated dimension of all items before this index.
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
   * @param exact - Search precision mode, defaults to exact search mode.
   *  - `0` for exact search;
   *  - `>0` to search for the minimum value greater than or equal to the target;
   *  - `<0` to search for the maximum value less than or equal to the target;
   * @returns Item index
   */
  findIndex(offset: number, exact?: number): number;
}
export const IAccumulatedDimensionManager: TIdentifier<IAccumulatedDimensionManager> =
  Symbol('IAccumulatedDimensionManager');

/**
 * Cell content
 */
export interface ICellContent<T = unknown> {
  /**
   * Cell content type
   */
  type: string;
  /**
   * Cell content value
   */
  value: T;
}

/**
 * Cell content type
 */
export type TCellContent<T = unknown> = string | null | ICellContent<T>;

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
   * The cell range where values will be set.
   */
  range: ICellRange;
  /**
   * The 2D array of values to be applied to the range.
   */
  values: TCellContent<T>[][];
}

/**
 * Union type for cell data change patches.
 */
export type TCellChangePatch<T = unknown> = IClearCellValuePatch | ISetCellValuePatch<T>;

/**
 * Interface for providing and managing spreadsheet cell data.
 */
export interface IDataProvider {
  /**
   * Retrieves the value of a cell at the specified row and column indices.
   *
   * @param rowIndex - The index of the row.
   * @param columnIndex - The index of the column.
   *
   * @returns The cell value, or undefined if empty.
   */
  get<T = unknown>(rowIndex: number, columnIndex: number): TCellContent<T> | undefined;

  /**
   * Sets the value of a cell at the specified row and column indices.
   *
   * @param patch - The patch representing the cell value change.
   */
  set<T = unknown>(patch: TCellChangePatch<T>): void;
}

/**
 * Interface for providing and managing spreadsheet cell data.
 */
export interface IDataManager extends IDisposable {
  /**
   * An observable that emits patches representing incremental changes to the data source.
   */
  readonly patch$: Observable<TCellChangePatch>;

  /**
   * Retrieves the value of a cell at the specified row and column indices.
   *
   * @param rowIndex - The index of the row.
   * @param columnIndex - The index of the column.
   *
   * @returns The cell value, or undefined if empty.
   */
  get<T = unknown>(rowIndex: number, columnIndex: number): TCellContent<T> | undefined;

  /**
   * Sets the value of a cell at the specified row and column indices.
   *
   * @param rowIndex - The index of the row.
   * @param columnIndex - The index of the column.
   * @param value - The value to set for the cell. If it is a 2D array, it will be set as a range.
   */
  set<T = unknown>(rowIndex: number, columnIndex: number, value: TCellContent<T> | TCellContent<T>[][]): void;

  /**
   * Clears the cell values for a given range.
   *
   * @param range - The cell range to clear values for.
   */
  clear(range: ICellRange): void;
}
/**
 * Identifier for the IDataManager interface.
 */
export const IDataManager: TIdentifier<IDataManager> = Symbol('IDataManager');
