const columnLabelMap = new Map<number, string>();

/**
 * Get the column header string
 *
 * - Usually strings like A, B, MN, XYZ
 * - Equivalent to converting a decimal number to a base-26 string represented by uppercase English letters
 *
 * @param columnIndex - The index of the column, starting from 0
 * @returns The column header string
 */
export function getColumnLabel(columnIndex: number): string {
  let result = columnLabelMap.get(columnIndex) ?? '';
  if (result) return result;

  let temp = columnIndex;
  while (temp >= 0) {
    const index = temp % 26;
    result = String.fromCharCode(65 + index) + result;
    temp = Math.floor(temp / 26) - 1;
  }

  columnLabelMap.set(columnIndex, result);
  return result;
}
