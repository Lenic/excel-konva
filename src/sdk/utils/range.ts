import type { ICellRange, ILocation } from '../core';

/**
 * Result of comparing two cell ranges
 */
export interface IRangeDiff {
  /**
   * Cells added in the new range
   */
  added: ILocation[];
  /**
   * Cells removed from the old range
   */
  removed: ILocation[];
}

/**
 * Compare two cell ranges and find the added and removed cells
 *
 * @param previous - The previous cell range
 * @param current - The current cell range
 * @returns The difference between the two ranges
 */
export function diffRanges(previous: ICellRange, current: ICellRange): IRangeDiff {
  const added: ILocation[] = [];
  const removed: ILocation[] = [];

  // Find added cells: in 'current' but not in 'previous'
  for (let r = current.rowStartIndex; r <= current.rowEndIndex; r++) {
    for (let c = current.columnStartIndex; c <= current.columnEndIndex; c++) {
      if (
        r < previous.rowStartIndex ||
        r > previous.rowEndIndex ||
        c < previous.columnStartIndex ||
        c > previous.columnEndIndex
      ) {
        added.push({ rowIndex: r, columnIndex: c });
      }
    }
  }

  // Find removed cells: in 'previous' but not in 'current'
  for (let r = previous.rowStartIndex; r <= previous.rowEndIndex; r++) {
    for (let c = previous.columnStartIndex; c <= previous.columnEndIndex; c++) {
      if (
        r < current.rowStartIndex ||
        r > current.rowEndIndex ||
        c < current.columnStartIndex ||
        c > current.columnEndIndex
      ) {
        removed.push({ rowIndex: r, columnIndex: c });
      }
    }
  }

  return { added, removed };
}

/**
 * Check if a cell is within a specific range
 *
 * @param range - The cell range to check
 * @param rowIndex - The row index of the cell
 * @param columnIndex - The column index of the cell
 * @returns True if the cell is within the range, otherwise false
 */
export function isCellInRange(range: ICellRange, rowIndex: number, columnIndex: number): boolean {
  return (
    rowIndex >= range.rowStartIndex &&
    rowIndex <= range.rowEndIndex &&
    columnIndex >= range.columnStartIndex &&
    columnIndex <= range.columnEndIndex
  );
}
