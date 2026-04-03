import type { IDisposable, TIdentifier } from '../../container';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

/**
 * Target dimension size
 */
export interface IDimension {
  /**
   * Width
   */
  width: number;
  /**
   * Height
   */
  height: number;
}

/**
 * Location information of the cell
 */
export interface ILocation {
  /**
   * Row index
   *
   * - 0-based
   */
  rowIndex: number;
  /**
   * Column index
   *
   * - 0-based
   */
  columnIndex: number;
}

/**
 * Coordinate point
 *
 * - The origin coordinate of the Canvas element is at its top-left corner.
 */
export interface IPoint {
  /**
   * X-axis coordinate
   */
  x: number;
  /**
   * Y-axis coordinate
   */
  y: number;
}

/**
 * Cell range
 *
 * - The start index is on the top-left
 * - The end index is on the bottom-right
 */
export interface ICellRange {
  /**
   * Row start index
   *
   * - 0-based
   */
  rowStartIndex: number;
  /**
   * Row end index
   *
   * - 0-based
   */
  rowEndIndex: number;
  /**
   * Column start index
   *
   * - 0-based
   */
  columnStartIndex: number;
  /**
   * Column end index
   *
   * - 0-based
   */
  columnEndIndex: number;
}

/**
 * Cell range change type
 */
export const ECellRangeChangeType = {
  /**
   * Unknown
   */
  UNKNOWN: 0,
  /**
   * Top
   */
  TOP: 1,
  /**
   * Right
   */
  RIGHT: 2,
  /**
   * Bottom
   */
  BOTTOM: 4,
  /**
   * Left
   */
  LEFT: 8,
} as const;

/**
 * Cell range change type
 */
export type ECellRangeChangeType = (typeof ECellRangeChangeType)[keyof typeof ECellRangeChangeType];
/**
 * Cell range change type mask
 */
export type TCellRangeChangeTypeMask = number;

/**
 * Change patch
 */
export interface IChangePatch<T = number> {
  /**
   * Previous value
   */
  previous: T;
  /**
   * Current value
   */
  current: T;
}

/**
 * Scroll offset
 */
export interface IOffset {
  /**
   * Horizontal displacement
   *
   * - Positive for right movement
   * - Negative for left movement
   */
  deltaX: number;
  /**
   * Vertical displacement
   *
   * - Positive for downward movement
   * - Negative for upward movement
   */
  deltaY: number;
}

/**
 * Freeze mode
 */
export const EFreezeMode = {
  /**
   * No freeze
   */
  NONE: 0,
  /**
   * Freeze rows
   */
  ROW: 1,
  /**
   * Freeze columns
   */
  COLUMN: 2,
  /**
   * Freeze both rows and columns
   */
  BOTH: 3,
} as const;
/**
 * Freeze mode type
 */
export type EFreezeMode = (typeof EFreezeMode)[keyof typeof EFreezeMode];

/**
 * A generic interface for handling and exposing observable value.
 */
export interface IObservableValue<TObservable, TValue = TObservable> extends IDisposable {
  /**
   * Current value
   *
   * - The current value is always the newest value.
   */
  value: TValue;
  /**
   * An observable stream that emits the current state or information.
   *
   * - The observable stream emits the newest value after the `value` property is set.
   */
  value$: Observable<TObservable>;
}

/**
 * Single offset change patch
 */
export interface ISingleOffsetChangePatch extends IChangePatch {
  /**
   * The type of offset change
   */
  type: 'top' | 'left';
}

/**
 * Both offset change patch
 */
export interface IBothOffsetChangePatch extends IChangePatch<IOffset> {
  /**
   * The type of offset change
   */
  type: 'both';
}

/**
 * Offset change patch
 */
export type TOffsetChangePatch = ISingleOffsetChangePatch | IBothOffsetChangePatch;

/**
 * Scroll offset
 */
export interface IScrollOffset extends IDisposable {
  /**
   * Observable scroll offset change
   */
  change$: Observable<TOffsetChangePatch>;

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
}
/**
 * Scroll offset interface identifier
 */
export const IScrollOffset: TIdentifier<IScrollOffset> = Symbol('IScrollOffset');

/**
 * Cell rect attrs
 */
export type TRectAttrs = Omit<Konva.RectConfig, 'x' | 'y' | 'width' | 'height'>;
/**
 * Cell text attrs
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
   * Minimal row height: default is 15px
   */
  minimalRowHeight?: number;
  /**
   * Column width: default is 100px
   */
  columnWidth?: number;
  /**
   * Minimal column width: default is 20px
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
   *   strokeWidth: 1
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
   * Observable option value changes
   * @param key Option key
   * @returns Observable option value changes
   */
  change$<K extends keyof Required<ISheetOptions>>(key: K): Observable<IChangePatch<Required<ISheetOptions>[K]>>;

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

/**
 * Render group
 */
export interface IRenderGroup {
  /**
   * Konva layer
   */
  layer: Konva.Layer;
  /**
   * Konva groups for each freeze mode
   */
  groups: Record<EFreezeMode, Konva.Group>;
}

/**
 * Konva items
 */
export interface IKonvaItems extends IDisposable {
  /**
   * Konva stage
   */
  stage: Konva.Stage;
  /**
   * Background groups
   */
  background: IRenderGroup;
  /**
   * Selection groups
   */
  selection: IRenderGroup;
  /**
   * Resize line
   */
  resizeLine: Konva.Line;
}
/**
 * Konva items identifier
 */
export const IKonvaItems: TIdentifier<IKonvaItems> = Symbol('IKonvaItems');
