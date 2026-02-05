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
