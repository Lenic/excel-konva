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
 * Check if two cell ranges are the same
 *
 * @param a - The first cell range
 * @param b - The second cell range
 * @returns True if the two cell ranges are the same, otherwise false
 */
export function isSameRange(a: ICellRange, b: ICellRange): boolean {
  return (
    a.rowStartIndex === b.rowStartIndex &&
    a.rowEndIndex === b.rowEndIndex &&
    a.columnStartIndex === b.columnStartIndex &&
    a.columnEndIndex === b.columnEndIndex
  );
}
