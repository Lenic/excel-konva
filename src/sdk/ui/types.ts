import type { IDisposable, TIdentifier } from '../../container';
import type {
  ECellRangeChangeType,
  ICellRange,
  IChangePatch,
  IDimension,
  IOffset,
  TCellRangeChangeTypeMask,
} from '../core';
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
  BOTH: 4,
} as const;

/**
 * Freeze mode type
 */
export type EFreezeMode = (typeof EFreezeMode)[keyof typeof EFreezeMode];

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
 * Viewport
 */
export interface IViewport extends IRectBox, IOffset, ICellRange {
  /**
   * Number of frozen rows
   */
  frozenRowCount: number;
  /**
   * Number of frozen columns
   */
  frozenColumnCount: number;
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
 * Viewport change patch
 */
export interface IViewportChangePatch extends IChangePatch<IViewport> {
  /**
   * The freeze mode.
   */
  mode: EFreezeMode;
}

/**
 * ViewportManager
 */
export interface IViewportManager extends Record<EFreezeMode, IViewport>, IDisposable {
  change$: Observable<IViewportChangePatch>;
}
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
