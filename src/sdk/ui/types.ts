import type { IDisposable, TIdentifier } from '../../container';
import type { ICellRange, IChangePatch, IDimension, IOffset, IPoint } from '../core';
import type { EFreezeMode } from '../core';
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

/**
 * ViewportManager
 */
export interface IViewportManager extends Record<EFreezeMode, IViewport>, IDisposable {}
/**
 * ViewportManager interface identifier
 */
export const IViewportManager: TIdentifier<IViewportManager> = Symbol('IViewportManager');

/**
 * Manages the geometric bounding boxes of cells, providing layout information
 * for rendering and hit testing.
 */
export interface ICellBoxManager extends IDisposable {
  /**
   * Retrieves the bounding box dimensions for a specific cell identified by
   * its row and column indices.
   *
   * @param rowIndex - The zero-based index of the row.
   * @param columnIndex - The zero-based index of the column.
   * @returns The rectangular area occupied by the specified cell.
   */
  getCellBox(rowIndex: number, columnIndex: number): IRectBox;

  /**
   * Returns a list of bounding boxes for all cells within the specified range.
   *
   * @param range - The coordinate range of cells to retrieve boxes for.
   * @returns An array of rectangular boxes corresponding to the cells in the range.
   */
  getCellBoxListByRange(range: ICellRange): IRectBox[];
}

/**
 * Dependency injection identifier for the ICellBoxManager service.
 */
export const ICellBoxManager: TIdentifier<ICellBoxManager> = Symbol('ICellBoxManager');

/**
 * A generic manager interface for handling and exposing observable state information.
 */
export interface IInformationManager<T> extends IDisposable {
  /**
   * An observable stream that emits the current state or information.
   */
  value$: Observable<T>;
}

/**
 * Defines a specific cell range with associated vertical and horizontal scroll keys,
 * used for managing scrollable viewports.
 */
export interface IScrollableRange extends ICellRange {
  /**
   * The unique identifier key for the vertical scroll state.
   */
  verticalKey: string;
  /**
   * The unique identifier key for the horizontal scroll state.
   */
  horizontalKey: string;
}

/**
 * Dependency injection identifier for the IScrollableRangeManager service.
 */
export const IScrollableRangeManager: TIdentifier<IInformationManager<IScrollableRange>> =
  Symbol('IScrollableRangeManager');

/**
 * Represents the configuration for frozen rows and columns, incorporating their total dimensions.
 */
export interface IFrozenInformation extends IDimension {
  /**
   * The total count of rows to be frozen at the top of the view.
   */
  rowCount: number;
  /**
   * The total count of columns to be frozen at the left side of the view.
   */
  columnCount: number;
}

/**
 * Dependency injection identifier for the IFrozenInformationManager service.
 */
export const IFrozenInformationManager: TIdentifier<IInformationManager<IFrozenInformation>> =
  Symbol('IFrozenInformationManager');
