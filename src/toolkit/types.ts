import type { IDisposable, TIdentifier } from '../container';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

/**
 * Location information of the cell
 */
export interface ILocation {
  /**
   * Row index
   */
  rowIndex: number;
  /**
   * Column index
   */
  columnIndex: number;
}

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
 * Position and size of the target box
 */
export interface IRectBox extends IPoint, IDimension {}

/**
 * Area information of the Sheet
 */
export interface IRegionInfo {
  /**
   * Starting row index
   */
  startRowIndex: number;
  /**
   * Ending row index
   */
  endRowIndex: number;
  /**
   * Starting column index
   */
  startColumnIndex: number;
  /**
   * Ending column index
   */
  endColumnIndex: number;
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
 * Excel entrance interface
 */
export interface IExcelEntrance extends IDisposable {
  /**
   * Root html element
   */
  rootElement: HTMLDivElement;
  /**
   * Scroll wrapper html element
   */
  scrollWrapper: HTMLDivElement;
  /**
   * Virtual content html element
   */
  virtualContent: HTMLDivElement;

  /**
   * Konva stage
   */
  stage: Konva.Stage;
  /**
   * Background layer
   */
  backgroundLayer: Konva.Layer;
  /**
   * Selection layer
   */
  selectionLayer: Konva.Layer;
  /**
   * Scrollable group
   */
  scrollableGroup: Konva.Group;
  /**
   * Side group
   */
  sideGroup: Konva.Group;
  /**
   * Header group
   */
  headerGroup: Konva.Group;
  /**
   * Corner group
   */
  cornerGroup: Konva.Group;
  /**
   * Resize line
   */
  resizeLine: Konva.Line;

  /**
   * Get cell group by row and column index
   */
  getCellGroup$: Observable<(rowIndex: number, columnIndex: number) => Konva.Group>;

  /**
   * Start the Excel entrance
   */
  start(): void;
}
/**
 * Excel entrance interface identifier
 */
export const IExcelEntrance: TIdentifier<IExcelEntrance> = Symbol('IExcelEntrance');
