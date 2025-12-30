import type { IDisposable } from '../core';
import type { IDimension, ILocation, IOffset, IPoint, IRectBox, IRegionInfo } from '../types';
import type { Observable } from 'rxjs';

/**
 * Sheet meta
 */
export interface ISheetMeta extends IDisposable {
  /**
   * Header height
   */
  headerHeight: number;
  /**
   * Header width
   */
  headerWidth: number;
  /**
   * Row height
   */
  rowHeight: number;
  /**
   * Min row height
   */
  minRowHeight: number;
  /**
   * Column width
   */
  columnWidth: number;
  /**
   * Min column width
   */
  minColumnWidth: number;
  /**
   * Row count
   */
  rowCount: number;
  /**
   * Column count
   */
  columnCount: number;
  /**
   * Frozen columns
   */
  frozenColumns: number;
  /**
   * Frozen rows
   */
  frozenRows: number;

  /**
   * Observable header height
   */
  headerHeight$: Observable<number>;
  /**
   * Observable header width
   */
  headerWidth$: Observable<number>;
  /**
   * Observable row height
   */
  rowHeight$: Observable<number>;
  /**
   * Observable min row height
   */
  minRowHeight$: Observable<number>;
  /**
   * Observable column width
   */
  columnWidth$: Observable<number>;
  /**
   * Observable min column width
   */
  minColumnWidth$: Observable<number>;
  /**
   * Observable row count
   */
  rowCount$: Observable<number>;
  /**
   * Observable column count
   */
  columnCount$: Observable<number>;
  /**
   * Observable frozen columns
   */
  frozenColumns$: Observable<number>;
  /**
   * Observable frozen rows
   */
  frozenRows$: Observable<number>;

  /**
   * Set header height
   */
  setHeaderHeight(height: number): void;
  /**
   * Set header width
   */
  setHeaderWidth(width: number): void;
  /**
   * Set row height
   */
  setRowHeight(height: number): void;
  /**
   * Set column width
   */
  setColumnWidth(width: number): void;
  /**
   * Set row count
   */
  setRowCount(count: number): void;
  /**
   * Set column count
   */
  setColumnCount(count: number): void;
  /**
   * Set frozen columns
   */
  setFrozenColumns(count: number): void;
  /**
   * Set frozen rows
   */
  setFrozenRows(count: number): void;
  /**
   * Set min row height
   */
  setMinRowHeight(height: number): void;
  /**
   * Set min column width
   */
  setMinColumnWidth(width: number): void;
}

/**
 * Item dimension manager options
 */
export interface IItemDimensionOptions {
  /**
   * Min dimension
   */
  minDimension: number;
  /**
   * Header dimension
   */
  headerDimension: number;
  /**
   * Default dimension
   */
  defaultDimension: number;
}

/**
 * Item dimension manager
 */
export interface IItemDimension extends IDisposable {
  /**
   * Dimension store
   */
  store: Map<number, number>;

  /**
   * Observable options
   */
  options$: Observable<IItemDimensionOptions>;
  /**
   * An Observable that emits a function to retrieve the dimension value for a specific index.
   *
   * The emitted function signature is: `(index: number) => number`
   * - `index`: The index of the item.
   * - Returns: The item size.
   */
  get$: Observable<(index: number) => number>;

  /**
   * Set dimension
   *
   * @param index - Dimension index
   * @param value - Dimension value
   */
  set(index: number, value: number): void;
  /**
   * Reset dimension
   *
   * @param index - Dimension index
   */
  reset(index: number): void;
}

/**
 * Accumulated dimension
 */
export interface IAccumulatedDimension extends IDisposable {
  /**
   * Accumulated store
   */
  store: Map<number, number>;
  /**
   * Item dimension manager
   */
  dimension: IItemDimension;

  /**
   * An Observable that emits a function to retrieve the preceding total dimension for a specific index.
   *
   * The emitted function signature is: `(index: number) => number`
   * - `index`: The index of the item.
   * - Returns: The preceding total dimension.
   */
  get$: Observable<(index: number) => number>;
}

/**
 * Sheet dimension
 */
export interface ISheetDimension extends IDisposable {
  /**
   * Sheet
   */
  sheet: ISheetMeta;
  /**
   * Accumulated column dimension
   */
  column: IAccumulatedDimension;
  /**
   * Accumulated row dimension
   */
  row: IAccumulatedDimension;

  /**
   * Visual size
   */
  visualSize: IDimension;
  /**
   * Real width
   */
  realWidth: number;
  /**
   * Real height
   */
  realHeight: number;
  /**
   * Real size
   */
  realSize: IDimension;

  /**
   * Observable visual size
   */
  visualSize$: Observable<IDimension>;
  /**
   * Observable real width
   */
  realWidth$: Observable<number>;
  /**
   * Observable real height
   */
  realHeight$: Observable<number>;
  /**
   * Observable real size
   */
  realSize$: Observable<IDimension>;
}

/**
 * Scroll offset
 */
export interface IScrollOffset extends IDisposable {
  /**
   * Sheet dimension
   */
  sheetDimension: ISheetDimension;
  /**
   * Scroll top
   */
  top: number;
  /**
   * Scroll left
   */
  left: number;
  /**
   * Scroll offset
   */
  offset: IOffset;

  /**
   * Observable scroll top
   */
  top$: Observable<number>;
  /**
   * Observable scroll left
   */
  left$: Observable<number>;
  /**
   * Observable scroll offset
   */
  offset$: Observable<IOffset>;
}

/**
 * Item boundary
 */
export interface IItemBoundary extends IDisposable {
  /**
   * Scroll offset
   */
  offset: IScrollOffset;
  /**
   * Accumulated column dimension
   */
  column: IAccumulatedDimension;
  /**
   * Accumulated row dimension
   */
  row: IAccumulatedDimension;
  /**
   * Sheet
   */
  sheet: ISheetMeta;

  /**
   * An Observable that emits a function to retrieve the preceding boundary for a specific column index.
   *
   * The emitted function signature is: `(columnIndex: number) => number`
   * - `columnIndex`: The index of the column.
   * - Returns: The preceding boundary.
   */
  getColumnLeft$: Observable<(columnIndex: number) => number>;
  /**
   * An Observable that emits a function to retrieve the preceding boundary for a specific row index.
   *
   * The emitted function signature is: `(rowIndex: number) => number`
   * - `rowIndex`: The index of the row.
   * - Returns: The preceding boundary.
   */
  getRowTop$: Observable<(rowIndex: number) => number>;
}

/**
 * Cell dimension
 */
export interface ICellDimension extends IDisposable {
  /**
   * Item boundary manager
   */
  boundary: IItemBoundary;

  /**
   * Cell data store
   */
  cellDataStore: Map<string, string>;

  /**
   * Set the content of the given cell.
   *
   * @param key - The key of the cell.
   * @param value - The value of the cell. `null` means clearing the cell content and setting it to the default value `undefined`.
   */
  setCellData(key: string, value: string | null): void;
  /**
   * Set the content of the given cell.
   *
   * @param rowIndex - The row index, starting from 0.
   * @param columnIndex - The column index, starting from 0.
   * @param value - The value of the cell. `null` means clearing the cell content and setting it to the default value `undefined`.
   */
  setCellData(rowIndex: number, columnIndex: number, value: string | null): void;

  /**
   * An Observable that emits a function to retrieve the cell data for a specific row and column.
   *
   * The emitted function signature is: `(rowIndex: number, columnIndex: number) => string`
   * - `rowIndex`: The index of the row.
   * - `columnIndex`: The index of the column.
   * - Returns: The cell data.
   */
  getCellData$: Observable<(rowIndex: number, columnIndex: number) => string>;
  /**
   * An Observable that emits a function to retrieve the cell rect box for a specific row and column.
   *
   * The emitted function signature is: `(rowIndex: number, columnIndex: number) => IRectBox`
   * - `rowIndex`: The index of the row.
   * - `columnIndex`: The index of the column.
   * - Returns: The cell rect box.
   */
  getCellRectBox$: Observable<(rowIndex: number, columnIndex: number) => IRectBox>;
  /**
   * An Observable that emits a function to retrieve the cell location for a specific row and column.
   *
   * The emitted function signature is: `(rowIndex: number, columnIndex: number) => ILocation`
   * - `rowIndex`: The index of the row.
   * - `columnIndex`: The index of the column.
   * - Returns: The cell location.
   */
  getCellLocation$: Observable<(rowIndex: number, columnIndex: number) => ILocation>;
  /**
   * An Observable that emits a function to retrieve the cell point for a specific row and column.
   *
   * The emitted function signature is: `(rowIndex: number, columnIndex: number) => IPoint`
   * - `rowIndex`: The index of the row.
   * - `columnIndex`: The index of the column.
   * - Returns: The cell point.
   */
  getCellPoint$: Observable<(rowIndex: number, columnIndex: number) => IPoint>;
}

/**
 * Data region info
 */
export interface IDataRegion {
  /**
   * Sheet
   */
  sheet: ISheetMeta;
  /**
   * Item boundary manager
   */
  boundary: IItemBoundary;
  /**
   * Sheet dimension
   */
  sheetDimension: ISheetDimension;

  /**
   * Data region
   */
  region: IRegionInfo;

  /**
   * Observable data region
   */
  region$: Observable<IRegionInfo>;
}
