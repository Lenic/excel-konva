import type { IDisposable, TIdentifier } from '../../container';
import type { IDimension, ILocation, IOffset, IPoint, IRectBox, IRegionInfo } from '../types';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

/**
 * Excel cell rect attrs
 */
export type TRectAttrs = Omit<Konva.RectConfig, 'x' | 'y' | 'width' | 'height'>;
/**
 * Excel cell text attrs
 */
export type TTextAttrs = Omit<Konva.TextConfig, 'x' | 'y' | 'width' | 'height' | 'text'>;

/**
 * Excel sheet options
 */
export interface ISheetOptions {
  /**
   * Header height: default is 30px
   */
  headerHeight?: number;
  /**
   * Header width: default is 40px
   */
  headerWidth?: number;
  /**
   * Row height: default is 28px
   */
  rowHeight?: number;
  /**
   * Min row height: default is 15px
   */
  minRowHeight?: number;
  /**
   * Column width: default is 100px
   */
  columnWidth?: number;
  /**
   * Min column width: default is 20px
   */
  minColumnWidth?: number;
  /**
   * Row count: default is 20
   */
  rowCount?: number;
  /**
   * Column count: default is 8
   */
  columnCount?: number;
  /**
   * Frozen columns: default is 1
   */
  frozenColumns?: number;
  /**
   * Frozen rows: default is 1
   */
  frozenRows?: number;
  /**
   * Resize line color: default is #4e95ff
   */
  resizeLineColor?: string;
  /**
   * Selection rect attrs
   *
   * The following object defines the default values:
   * ```json
   * {
   *   fill: 'rgba(78, 149, 255, 0.15)',
   *   stroke: '#4e95ff',
   *   strokeWidth: 2
   * }
   * ```
   */
  selectionRectAttrs?: Partial<TRectAttrs>;
  /**
   * Active cell rect attrs
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   *   fill: 'rgba(0, 0, 0, 0)',
   *   stroke: '#10B981',
   *   strokeWidth: 2
   * }
   * ```
   */
  activeCellRectAttrs?: Partial<TRectAttrs>;
  /**
   * Default cell rect attrs
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   *   fill: '#ffffff',
   *   stroke: '#e8e8e8',
   *   strokeWidth: 0.5
   * }
   * ```
   */
  defaultCellRectAttrs?: Partial<TRectAttrs>;
  /**
   * Default odd cell rect attrs
   *
   * The final value is: defaultCellRectAttrs + defaultOddCellRectAttrs
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   * }
   * ```
   */
  defaultOddCellRectAttrs?: Partial<TRectAttrs>;
  /**
   * Default even cell rect attrs
   *
   * The final value is: defaultCellRectAttrs + defaultEvenCellRectAttrs
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   *   fill: '#f9f9f9'
   * }
   * ```
   */
  defaultEvenCellRectAttrs?: Partial<TRectAttrs>;
  /**
   * Frozen cell rect attrs
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   *   stroke: '#cccccc',
   *   strokeWidth: 1
   * }
   * ```
   */
  frozenCellRectAttrs?: Partial<TRectAttrs>;
  /**
   * Frozen odd cell rect attrs
   *
   * The final result is: defaultOddCellRectAttrs + frozenCellRectAttrs + current value
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   * }
   * ```
   */
  frozenOddCellRectAttrs?: Partial<TRectAttrs>;
  /**
   * Frozen even cell rect attrs
   *
   * The final result is: defaultEvenCellRectAttrs + frozenCellRectAttrs + current value
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   * }
   * ```
   */
  frozenEvenCellRectAttrs?: Partial<TRectAttrs>;
  /**
   * Header cell rect attrs
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   *   fill: '#f0f0f0'
   * }
   * ```
   */
  headerCellRectAttrs?: Partial<TRectAttrs>;
  /**
   * Column header cell rect attrs
   *
   * The final result is: defaultCellRectAttrs + frozenCellRectAttrs + headerCellRectAttrs + current value
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   * }
   * ```
   */
  columnHeaderCellRectAttrs?: Partial<TRectAttrs>;
  /**
   * Row header cell rect attrs
   *
   * The final result is: defaultCellRectAttrs + frozenCellRectAttrs + headerCellRectAttrs + current value
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   */
  rowHeaderCellRectAttrs?: Partial<TRectAttrs>;
  /**
   * Corner cell rect attrs
   *
   * The final result is: defaultCellRectAttrs + frozenCellRectAttrs + headerCellRectAttrs + current value
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   *   fill: '#e0e0e0',
   * }
   * ```
   */
  cornerCellRectAttrs?: Partial<TRectAttrs>;
  /**
   * Default cell text attrs
   *
   * The following object defines the default values:
   *
   *
   * {
   *   fontSize: 12,
   *   fontFamily: 'Inter, Arial, sans-serif',
   *   fill: '#333333',
   *   verticalAlign: 'middle',
   *   padding: 8,
   *   align: 'left',
   *   ellipsis: true,
   *   wrap: 'none'
   */
  defaultCellTextAttrs?: Partial<TTextAttrs>;
  /**
   * Default odd cell text attrs
   *
   * The final result is: defaultCellTextAttrs + defaultOddCellTextAttrs
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   * }
   * ```
   */
  defaultOddCellTextAttrs?: Partial<TTextAttrs>;
  /**
   * Default even cell text attrs
   *
   * The final result is: defaultCellTextAttrs + defaultEvenCellTextAttrs
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   * }
   * ```
   */
  defaultEvenCellTextAttrs?: Partial<TTextAttrs>;
  /**
   * Frozen cell text attrs
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   * }
   * ```
   */
  frozenCellTextAttrs?: Partial<TTextAttrs>;
  /**
   * Frozen odd cell text attrs
   *
   * The final result is: defaultOddCellTextAttrs + frozenCellTextAttrs + current value
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   * }
   * ```
   */
  frozenOddCellTextAttrs?: Partial<TTextAttrs>;
  /**
   * Frozen even cell text attrs
   *
   * The final result is: defaultEvenCellTextAttrs + frozenCellTextAttrs + current value
   *
   * The following object defines the default values:
   *
   * {
   * }
   * ```
   */
  frozenEvenCellTextAttrs?: Partial<TTextAttrs>;
  /**
   * Header cell text attrs
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   *   fontSize: 14,
   *   fill: '#000000',
   *   align: 'center'
   * }
   * ```
   */
  headerCellTextAttrs?: Partial<TTextAttrs>;
  /**
   * Column header cell text attrs
   *
   * The final result is: defaultCellTextAttrs + frozenCellTextAttrs + headerCellTextAttrs + current value
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   * }
   * ```
   */
  columnHeaderCellTextAttrs?: Partial<TTextAttrs>;
  /**
   * Row header cell text attrs
   *
   * The final result is: defaultCellTextAttrs + frozenCellTextAttrs + headerCellTextAttrs + current value
   *
   * The following object defines the default values:
   *
   * ```json
   * {
   *   padding: 0
   * }
   * ```
   */
  rowHeaderCellTextAttrs?: Partial<TTextAttrs>;
  /**
   * The tolerance of mouse detection boundary (pixels): default is 5
   */
  resizeTolerance?: number;
}

/**
 * Sheet Config
 */
export interface ISheetConfig extends IDisposable {
  /**
   * Options
   */
  options: Required<ISheetOptions>;
  /**
   * Observable options
   */
  options$: Observable<Required<ISheetOptions>>;

  /**
   * Get option value
   * @param key Option key
   * @returns Observable option value
   */
  get$<K extends keyof Required<ISheetOptions>>(key: K): Observable<Required<ISheetOptions>[K]>;

  /**
   * Set options
   * @param options - Options to set or a function to compute the new options
   */
  set(options: Partial<ISheetOptions> | ((options: Required<ISheetOptions>) => Required<ISheetOptions>)): void;
}
/**
 * Sheet config identifier
 */
export const ISheetConfig: TIdentifier<ISheetConfig> = Symbol('ISheetConfig');

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
 * Item dimension manager identifier
 */
export const IItemDimension: TIdentifier<IItemDimension> = Symbol('IItemDimension');

/**
 * Accumulated dimension
 */
export interface IAccumulatedDimension extends IDisposable {
  /**
   * Accumulated store
   */
  store: Map<number, number>;

  /**
   * An Observable that emits a function to retrieve the preceding total dimension for a specific index.
   *
   * The emitted function signature is: `(index: number) => number`
   * - `index`: The index of the item.
   * - Returns: The preceding total dimension.
   */
  get$: Observable<(index: number) => number>;
  /**
   * An Observable that emits a function to find the item index for a specific offset.
   *
   * The emitted function signature is: `(offset: number) => number`
   * - `offset`: The offset.
   * - Returns: The item index.
   */
  findIndex$: Observable<(offset: number) => number>;
}
/**
 * Accumulated dimension identifier
 */
export const IAccumulatedDimension: TIdentifier<IAccumulatedDimension> = Symbol('IAccumulatedDimension');

/**
 * Sheet dimension
 */
export interface ISheetDimension extends IDisposable {
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
 * Sheet dimension identifier
 */
export const ISheetDimension: TIdentifier<ISheetDimension> = Symbol('ISheetDimension');

/**
 * Scroll offset
 */
export interface IScrollOffset extends IDisposable {
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
 * Scroll offset identifier
 */
export const IScrollOffset: TIdentifier<IScrollOffset> = Symbol('IScrollOffset');

/**
 * Item boundary options
 */
export interface IItemBoundaryOptions {
  /**
   * Observable scroll value
   */
  scrollValue$: Observable<number>;
  /**
   * Observable frozen count
   */
  frozenCount$: Observable<number>;
}

/**
 * Item boundary
 */
export interface IItemBoundary extends IDisposable {
  /**
   * Options
   */
  options: IItemBoundaryOptions;
  /**
   * An Observable that emits a function to retrieve the preceding boundary for a specific index.
   *
   * The emitted function signature is: `(index: number) => number`
   * - `index`: The index of the item.
   * - Returns: The preceding boundary.
   */
  getBoundary$: Observable<(index: number) => number>;
  /**
   * An Observable that emits a function to retrieve the item index for a specific relative offset.
   *
   * The emitted function signature is: `(relOffset: number) => number`
   * - `relOffset`: The relative offset.
   * - Returns: The item index.
   */
  getItemIndex$: Observable<(relOffset: number) => number>;
}
/**
 * Item boundary identifier
 */
export const IItemBoundary: TIdentifier<IItemBoundary> = Symbol('IItemBoundary');

/**
 * Cell dimension
 */
export interface ICellDimension extends IDisposable {
  /**
   * Cell data store
   */
  cellDataStore: Map<string, unknown>;

  /**
   * Set the content of the given cell.
   *
   * @param key - The key of the cell.
   * @param value - The value of the cell. `undefined` means clearing the cell content and setting it to the default value `undefined`.
   */
  setCellData(key: string, value?: unknown): void;
  /**
   * Set the content of the given cell.
   *
   * @param rowIndex - The row index, starting from 0.
   * @param columnIndex - The column index, starting from 0.
   * @param value - The value of the cell. `undefined` means clearing the cell content and setting it to the default value `undefined`.
   */
  setCellData(rowIndex: number, columnIndex: number, value?: unknown): void;

  /**
   * An Observable that emits a function to retrieve the cell data for a specific row and column.
   *
   * The emitted function signature is: `(rowIndex: number, columnIndex: number) => string`
   * - `rowIndex`: The index of the row.
   * - `columnIndex`: The index of the column.
   * - Returns: The cell data.
   */
  getCellData$: Observable<(rowIndex: number, columnIndex: number) => unknown>;
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
   * An Observable that emits a function to retrieve the cell location for a specific relative X and Y coordinate.
   *
   * The emitted function signature is: `(relX: number, relY: number) => ILocation`
   * - `relX`: The relative X coordinate relative to the canvas.
   * - `relY`: The relative Y coordinate relative to the canvas.
   * - Returns: The cell location.
   */
  getCellLocation$: Observable<(relX: number, relY: number) => ILocation>;
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
 * Cell dimension identifier
 */
export const ICellDimension: TIdentifier<ICellDimension> = Symbol('ICellDimension');

/**
 * Data region info
 */
export interface IDataRegion extends IDisposable {
  /**
   * Scrollable region info
   */
  region: IRegionInfo;

  /**
   * Observable scrollable region info
   */
  region$: Observable<IRegionInfo>;
}
/**
 * Data region identifier
 */
export const IDataRegion: TIdentifier<IDataRegion> = Symbol('IDataRegion');
