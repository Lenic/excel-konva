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

export interface IChangePatch<T = unknown> {
  previous: T;
  current: T;
}
