import type Konva from 'konva';
import type { Observable } from 'rxjs';

export interface ISelectedRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  activeRow: number;
  activeCol: number;
}

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

export interface IUserState {
  scrollX: number;
  scrollY: number;
  selectedRanges: ISelectedRange[];
  startCell: ILocation | null;
  lastRenderTime: number;
  animationFrameId: number | null;
}

export interface ICellRegionOptions {
  rectAttrs: Omit<Konva.RectConfig, 'x' | 'y' | 'width' | 'height'>;
  textAttrs: Omit<Konva.TextConfig, 'x' | 'y' | 'width' | 'height' | 'text'>;
}

/**
 * Render listener interface
 */
export interface IRenderListener<T> {
  /**
   * Rendering data
   */
  data: T | null;
  /**
   * Observable of rendering data
   */
  data$: Observable<T>;

  /**
   * Start listening to rendering events
   *
   * @returns A function to stop listening to events
   */
  start(): () => void;
}
