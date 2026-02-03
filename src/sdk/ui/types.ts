import type { IDisposable, TIdentifier } from '../../container';
import type { ICellRange, IChangePatch, IDimension } from '../types';
import type { Observable } from 'rxjs';

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

export interface IRectBox extends IPoint, IDimension {}

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
 * Viewport
 */
export interface IViewport extends IRectBox, IOffset {
  /**
   * Number of frozen rows
   */
  frozenRowCount: number;
  /**
   * Number of frozen columns
   */
  frozenColumnCount: number;
}

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

export interface IScrollSingleOffsetChangePatch extends IChangePatch {
  type: 'top' | 'left';
}

export interface IScrollBothOffsetChangePatch extends IChangePatch<IOffset> {
  type: 'both';
}

export type TScrollOffsetChangePatch = IScrollSingleOffsetChangePatch | IScrollBothOffsetChangePatch;

/**
 * Scroll offset
 */
export interface IScrollOffset extends IDisposable {
  /**
   * Observable scroll offset change
   */
  change$: Observable<TScrollOffsetChangePatch>;

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

export interface ILayoutCache extends IDisposable {
  /**
   * 查询单个 cell 的布局
   */
  getCellRect(rowIndex: number, columnIndex: number): IRectBox;

  /**
   * 查询一个范围（用于批量绘制）
   */
  getRangeRects(range: ICellRange): IRectBox[];

  /**
   * 失效某个区域
   */
  invalidateRange(range: ICellRange): void;

  /**
   * Dimension 变化触发的失效（整行 / 整列）
   */
  invalidateByRow(rowIndex: number): void;
  invalidateByColumn(columnIndex: number): void;
}
