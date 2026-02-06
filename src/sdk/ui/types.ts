import type { IDisposable, TIdentifier } from '../../container';
import type { ICellRange, IChangePatch, IDimension, IOffset } from '../core';
import type { EFreezeMode } from '../reference';
import type { Observable } from 'rxjs';

/**
 * Single sheet dimension change patch
 */
export interface ISingleSheetDimensionChangePatch extends IChangePatch {
  /**
   * The type of patch, set to 'width' or 'height'.
   */
  type: 'width' | 'height';
}

/**
 * Both sheet dimension change patch
 */
export interface IBothSheetDimensionChangePatch extends IChangePatch<IDimension> {
  /**
   * The type of patch, set to 'both'.
   */
  type: 'both';
}

/**
 * Sheet dimension change patch
 */
export type TSheetDimensionChangePatch = ISingleSheetDimensionChangePatch | IBothSheetDimensionChangePatch;

/**
 * Sheet dimension
 */
export interface ISheetDimension extends IDisposable {
  /**
   * Observable sheet dimension change
   */
  change$: Observable<TSheetDimensionChangePatch>;

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
}
/**
 * SheetDimension interface identifier
 */
export const ISheetDimension: TIdentifier<ISheetDimension> = Symbol('ISheetDimension');

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
 * Rect box
 */
export interface IRectBox extends IPoint, IDimension {}

/**
 * Viewport box change patch
 */
export interface IViewportBoxChangePatch extends IChangePatch<IRectBox> {
  /**
   * The type of patch, set to 'box'.
   */
  type: 'box';
}

/**
 * Viewport offset change patch
 */
export interface IViewportOffsetChangePatch extends IChangePatch<IOffset> {
  /**
   * The type of patch, set to 'offset'.
   */
  type: 'offset';
}

/**
 * Viewport range change patch
 */
export interface IViewportRangeChangePatch extends IChangePatch<ICellRange> {
  /**
   * The type of patch, set to 'range'.
   */
  type: 'range';
}

/**
 * Viewport change patch
 */
export type TViewportChangePatch = IViewportBoxChangePatch | IViewportOffsetChangePatch | IViewportRangeChangePatch;

/**
 * Viewport
 */
export interface IViewport extends IDisposable {
  /**
   * Observable viewport change
   */
  change$: Observable<TViewportChangePatch>;

  /**
   * Viewport box
   */
  box: IRectBox;
  /**
   * Viewport offset
   */
  offset: IOffset;
  /**
   * Viewport range
   */
  range: ICellRange;
}

export interface IViewportOptions {
  /**
   * Observable number of frozen rows
   */
  frozenRowCount$: Observable<number>;
  /**
   * Observable number of frozen columns
   */
  frozenColumnCount$: Observable<number>;
}

/**
 * ViewportManager
 */
export interface IViewportManager extends Record<EFreezeMode, IViewport>, IDisposable {}
/**
 * ViewportManager interface identifier
 */
export const IViewportManager: TIdentifier<IViewportManager> = Symbol('IViewportManager');

export interface ILayoutCache extends IDisposable {
  getCellRect(rowIndex: number, columnIndex: number): IRectBox;
  getRangeRects(range: ICellRange): IRectBox[];
  invalidateRange(range: ICellRange): void;
  invalidateByRow(rowIndex: number): void;
  invalidateByColumn(columnIndex: number): void;
}
/**
 * Identifier for the ILayoutCache interface.
 */
export const ILayoutCache: TIdentifier<ILayoutCache> = Symbol('ILayoutCache');
