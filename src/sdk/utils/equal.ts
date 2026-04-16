import type { ICellRange, ILocation, IPoint } from '../core';

/**
 * Checks if two points are equal by comparing their x and y coordinates.
 *
 * @param a - The first point to compare, or null.
 * @param b - The second point to compare, or null.
 * @returns True if both points are null or have identical coordinates; otherwise, false.
 */
export function isEqualPoint(a: IPoint | null, b: IPoint | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.x === b.x && a.y === b.y;
}

/**
 * Checks if two locations are equal by comparing their row and column indices.
 *
 * @param a - The first location to compare, or null.
 * @param b - The second location to compare, or null.
 * @returns True if both locations are null or have identical indices; otherwise, false.
 */
export function isEqualLocation(a: ILocation | null, b: ILocation | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.rowIndex === b.rowIndex && a.columnIndex === b.columnIndex;
}

/**
 * Checks if two selection regions are equal by comparing their range and anchor locations.
 *
 * @param a - The first selection region to compare, or null.
 * @param b - The second selection region to compare, or null.
 * @returns True if both selection regions are null or have identical ranges and anchor locations; otherwise, false.
 */
export function isEqualRange(a: ICellRange | null, b: ICellRange | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return (
    a.rowStartIndex === b.rowStartIndex &&
    a.rowEndIndex === b.rowEndIndex &&
    a.columnStartIndex === b.columnStartIndex &&
    a.columnEndIndex === b.columnEndIndex
  );
}
