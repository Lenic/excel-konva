import type { IDisposable } from '../../container';
import type { ICellRange, IDimension } from '../types';
import type { Observable } from 'rxjs';

/**
 * Coordinate point
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

export interface ILayoutCache extends IDisposable {
  /**
   * 查询单个 cell 的布局
   */
  getCellRect(row: number, col: number): IRectBox;

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
  invalidateByRow(row: number): void;
  invalidateByCol(col: number): void;
}
