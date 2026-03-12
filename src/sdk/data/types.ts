import type { IDisposable, TIdentifier } from '../../container';
import type { ICellRange, IChangePatch } from '../core';
import type { Observable } from 'rxjs';

/**
 * Configuration for row or column sizes.
 */
export interface IDimensionOptions {
  /**
   * The minimum allowable size for a row or column (e.g., minimum height or width).
   */
  minimalDimension: number;
  /**
   * The default size for header rows or columns (assigned to index 0).
   */
  headerDimension: number;
  /**
   * The default size for all other rows or columns.
   */
  defaultDimension: number;
}

/**
 * Represents a change to the size of a specific row or column.
 */
export interface IDimensionChangePatch extends IChangePatch {
  /**
   * Identifies this as a dimension-related patch.
   */
  type: 'dimension';
  /**
   * The specific row or column index being modified.
   */
  index: number;
}

/**
 * Represents a change to the global dimension configuration (IDimensionOptions).
 */
export interface IDimensionOptionsChangePatch extends IChangePatch<IDimensionOptions> {
  /**
   * Identifies this as an options-related patch.
   */
  type: 'options';
}

/**
 * Union type representing any update patch related to dimensions.
 */
export type TDimensionPatch = IDimensionChangePatch | IDimensionOptionsChangePatch;

/**
 * Interface for managing row or column sizes.
 */
export interface IDimensionManager extends IDisposable {
  /**
   * An observable stream that emits whenever a dimension or its configuration is updated.
   */
  readonly change$: Observable<TDimensionPatch>;

  /**
   * Retrieves the size of the row or column at the specified index.
   *
   * @param index - The row or column index.
   * @returns The size of the dimension.
   */
  get(index: number): number;

  /**
   * Updates the size of the row or column at the given index.
   *
   * @param index - The row or column index.
   * @param value - The new size. If 'undefined', it resets to the default size.
   */
  set(index: number, value?: number): void;
}
/**
 * Unique identifier for the IDimensionManager service.
 */
export const IDimensionManager: TIdentifier<IDimensionManager> = Symbol('IDimensionManager');

/**
 * Represents a change indicating that the total number of accumulated dimensions has been modified.
 */
export interface TAccumulatedDimensionCountChangePatch extends IChangePatch {
  /**
   * Identifies this as a count-related patch.
   */
  type: 'count';
}

/**
 * Union type for any patch that affects accumulated dimensions.
 */
export type TAccumulatedDimensionPatch = TDimensionPatch | TAccumulatedDimensionCountChangePatch;

/**
 * Cache structure used to accelerate the lookup of accumulated dimension indices and offsets.
 */
export interface IAccumulatedFindIndexCache {
  /**
   * The row or column index.
   */
  index: number;
  /**
   * The cumulative offset (total size) of all items preceding this index.
   */
  offset: number;
}

/**
 * Options for searching or looking up indices within accumulated dimension data.
 */
export interface IAccumulatedFindOptions {
  /**
   * The index where the search should begin.
   *
   * @default 0
   */
  startIndex?: number;
  /**
   * Optional cached mapping or result to optimize search performance.
   */
  cache?: IAccumulatedFindIndexCache;
  /**
   * Determines search precision or behavior:
   * - `0`: Exact match (default).
   * - `>0`: Finds the smallest index greater than or equal to the target.
   * - `<0`: Finds the largest index less than or equal to the target.
   */
  exact?: number;
}

/**
 * Manages the calculation and lookup of cumulative pixel offsets (accumulated dimensions).
 */
export interface IAccumulatedDimensionManager {
  /**
   * The max the cumulative offset.
   */
  readonly maxOffset: number;
  /**
   * An observable stream that emits whenever accumulated dimension data is updated.
   */
  readonly change$: Observable<TAccumulatedDimensionPatch>;

  /**
   * Retrieves the cumulative offset (total size) of all items preceding the specified index.
   *
   * @param index - The item index.
   * @returns The accumulated dimension offset.
   */
  get(index: number): number;
  /**
   * Finds the index corresponding to a given cumulative offset (pixel position).
   *
   * @param offset - The cumulative offset to look up.
   * @param options - Search options.
   * @returns The corresponding item index.
   */
  findIndex(offset: number, options?: IAccumulatedFindOptions): number;
}

/**
 * Unique identifier for the IAccumulatedDimensionManager service.
 */
export const IAccumulatedDimensionManager: TIdentifier<IAccumulatedDimensionManager> =
  Symbol('IAccumulatedDimensionManager');

/**
 * Represents the structured data stored within a cell.
 */
export interface ICellContent<T = unknown> {
  /**
   * The metadata type of the cell content (e.g., 'text', 'number', 'formula').
   */
  type: string[];
  /**
   * The actual data value stored in the cell.
   */
  value: T;
}

/**
 * Union type representing various formats of cell content.
 * It can be a literal string, null (empty), or a structured ICellContent object.
 */
export type TCellContent<T = unknown> = string | null | ICellContent<T>;

/**
 * Represents a command patch to clear all cell values within a specific range.
 */
export interface IClearCellValuePatch {
  /**
   * Identifies this as a 'clear' operation.
   */
  type: 'clear';
  /**
   * The cell range to be cleared.
   */
  range: ICellRange;
}

/**
 * Represents a command patch to populate a specific cell range with values.
 */
export interface ISetCellValuePatch<T = unknown> {
  /**
   * Identifies this as a 'set' operation.
   */
  type: 'set';
  /**
   * The target cell range for the operation.
   */
  range: ICellRange;
  /**
   * A 2D array of content to be applied to the specified range.
   */
  values: TCellContent<T>[][];
}

/**
 * Union type for any patch representing a change in cell data.
 */
export type TCellChangePatch<T = unknown> = IClearCellValuePatch | ISetCellValuePatch<T>;

/**
 * Interface for the underlying data source provider of the spreadsheet.
 */
export interface IDataProvider {
  /**
   * Retrieves the content of a cell at the given row and column indices.
   *
   * @param rowIndex - The index of the row.
   * @param columnIndex - The index of the column.
   * @returns The cell content, or undefined if the cell is empty.
   */
  get<T = unknown>(rowIndex: number, columnIndex: number): TCellContent<T>;

  /**
   * Applies a change patch to the cell data.
   *
   * @param patch - The patch representing the modification.
   */
  set<T = unknown>(patch: TCellChangePatch<T>): void;
}

/**
 * Public API for managing and observing spreadsheet cell data.
 */
export interface IDataManager extends IDisposable {
  /**
   * An observable stream that emits patches representing real-time updates to the data.
   */
  readonly change$: Observable<TCellChangePatch>;

  /**
   * Retrieves the content of a cell at the given row and column indices.
   *
   * @param rowIndex - The index of the row.
   * @param columnIndex - The index of the column.
   * @returns The cell content, or undefined if the cell is empty.
   */
  get<T = unknown>(rowIndex: number, columnIndex: number): TCellContent<T>;

  /**
   * Updates the content of a cell or a range of cells.
   *
   * @param rowIndex - The starting row index.
   * @param columnIndex - The starting column index.
   * @param value - The new content to set. If a 2D array, it populates a range starting from the coordinates.
   */
  set<T = unknown>(rowIndex: number, columnIndex: number, value: TCellContent<T> | TCellContent<T>[][]): void;

  /**
   * Removes all content from cells within the specified range.
   *
   * @param range - The cell range to clear.
   */
  clear(range: ICellRange): void;
}

/**
 * Unique identifier for the IDataManager service.
 */
export const IDataManager: TIdentifier<IDataManager> = Symbol('IDataManager');
