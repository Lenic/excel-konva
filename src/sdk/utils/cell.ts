import type { ICellRange, ILocation } from '../core';

/**
 * Get the key of the cell
 *
 * @param rowIndex - The index of the row, starting from 0
 * @param columnIndex - The index of the column, starting from 0
 * @returns The key of the cell
 */
export function getCellKey(rowIndex: number, columnIndex: number): string {
  return `R${rowIndex}_C${columnIndex}`;
}

/**
 * Check if the specified cell is within the given range
 *
 * @param cell - The location information of the cell
 * @param range - The cell range to check against
 * @returns True if the cell is in range, false otherwise
 */
export function isCellInRange(cell: ILocation, range: ICellRange): boolean;
/**
 * Check if the cell at the specified row and column indices is within the given range
 *
 * @param rowIndex - The row index of the cell
 * @param columnIndex - The column index of the cell
 * @param range - The cell range to check against
 * @returns True if the cell is in range, false otherwise
 */
export function isCellInRange(rowIndex: number, columnIndex: number, range: ICellRange): boolean;
export function isCellInRange(...args: any[]): boolean {
  let rowIndex: number;
  let columnIndex: number;
  let range: ICellRange;

  if (args.length === 2) {
    const [cell, r] = args as [ILocation, ICellRange];
    rowIndex = cell.rowIndex;
    columnIndex = cell.columnIndex;
    range = r;
  } else {
    [rowIndex, columnIndex, range] = args as [number, number, ICellRange];
  }

  return (
    rowIndex >= range.rowStartIndex &&
    rowIndex <= range.rowEndIndex &&
    columnIndex >= range.columnStartIndex &&
    columnIndex <= range.columnEndIndex
  );
}
