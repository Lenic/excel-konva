import type Konva from 'konva';
import type { IDisposable, TIdentifier } from '../../container';
import type { IDimension } from '../types';
import type { Observable } from 'rxjs';

/**
 * Sheet dimension
 */
export interface ISheetDimension extends IDisposable {
  /**
   * Width
   */
  width: number;
  /**
   * Height
   */
  height: number;
  /**
   * Size
   */
  size: IDimension;

  /**
   * Observable width
   */
  width$: Observable<number>;
  /**
   * Observable height
   */
  height$: Observable<number>;
  /**
   * Observable size
   */
  size$: Observable<IDimension>;
}

/**
 * Cell rect attrs
 */
export type TRectAttrs = Omit<Konva.RectConfig, 'x' | 'y' | 'width' | 'height'>;
/**
 * Cell text attrs
 */
export type TTextAttrs = Omit<Konva.TextConfig, 'x' | 'y' | 'width' | 'height' | 'text'>;

/**
 * Sheet options
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
  minimalRowHeight?: number;
  /**
   * Column width: default is 100px
   */
  columnWidth?: number;
  /**
   * Min column width: default is 20px
   */
  minimalColumnWidth?: number;
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
 * Sheet Config Identifier
 */
export const ISheetConfig: TIdentifier<ISheetConfig> = Symbol('ISheetConfig');
