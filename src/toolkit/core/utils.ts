/**
 * 获取单元格的 Key
 *
 * @param rowIndex - 行的索引，从数字 0 开始
 * @param columnIndex - 列的索引，从数字 0 开始
 */
export function getCellKey(rowIndex: number, columnIndex: number) {
  return `R${rowIndex}_C${columnIndex}`;
}

const columnLablMap = new Map<number, string>();
/**
 * 获取列的列头字符串
 *
 * - 一般应该是 A、B、MN、XYZ 这样的字符串
 * - 相当于将十进制的数字转换为 26 进制的，以大写英文字母表示的字符串
 *
 * @param columnIndex - 列的索引，从数字 0 开始
 */
export function getColumnLabel(columnIndex: number) {
  let result = columnLablMap.get(columnIndex) ?? '';
  if (result) return result;

  let temp = columnIndex;
  while (temp >= 0) {
    const index = temp % 26;
    result = String.fromCharCode(65 + index) + result;
    temp = Math.floor(temp / 26) - 1;
  }

  columnLablMap.set(columnIndex, result);
  return result;
}

/**
 * Enhanced binary search function.
 *
 * - Assumes the original data is a sorted list in ascending order, and `comparer` returns the result of [value at mid index - target value];
 * - If `begin > end`, returns -1 indicating no matching index found;
 *
 * @param begin - The starting index of the search (inclusive).
 * @param end - The ending index of the search (inclusive).
 * @param comparer - Comparison function, receives the current mid index and returns the comparison result with the target value.
 * @param exact - Search precision mode, defaults to exact search mode.
 *  - `0` for exact search;
 *  - `>0` to search for the minimum value greater than or equal to the target;
 *  - `<0` to search for the maximum value less than or equal to the target;
 * @returns The found index, or -1 if no matching index is found.
 */
export function binarySearch(begin: number, end: number, comparer: (mid: number) => number, exact = 0): number {
  // Basic validity check
  if (begin > end) return -1;

  // 1. Boundary test: Start point
  const resBegin = comparer(begin);
  if (resBegin === 0) return begin; // Exactly the start point
  if (resBegin > 0) {
    // Target value < list minimum (list[begin])
    // exact > 0 (find >=): The first item in the list
    // exact <= 0 (find == or <=): Not found or nothing on the left
    return exact > 0 ? begin : -1;
  }

  // 2. Boundary test: End point
  const resEnd = comparer(end);
  if (resEnd === 0) return end; // Exactly the end point
  if (resEnd < 0) {
    // Target value > list maximum (list[end])
    // exact < 0 (find <=): The last item in the list
    // exact >= 0 (find == or >=): Not found or nothing on the right
    return exact < 0 ? end : -1;
  }

  // 3. Core loop: The target value must be within the range (begin, end)
  let left = begin + 1;
  let right = end - 1;

  // Preset candidate value
  // If exact > 0, no equal value found, the closest "greater" value is at least end
  // If exact < 0, no equal value found, the closest "smaller" value is at least begin
  let candidate = exact > 0 ? end : exact < 0 ? begin : -1;

  while (left <= right) {
    const mid = Math.floor(left + (right - left) / 2);
    const result = comparer(mid);

    if (result === 0) {
      return mid;
    } else if (result < 0) {
      // mid value is too small, look to the right
      if (exact < 0) candidate = mid;
      left = mid + 1;
    } else {
      // mid value is too large, look to the left
      if (exact > 0) candidate = mid;
      right = mid - 1;
    }
  }

  return exact === 0 ? -1 : candidate;
}
