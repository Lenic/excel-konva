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
 * 在一个已排序的数组中使用二分查找法查找目标元素
 *
 * @param list - 已排序的数组
 * @param comparer - 用于比较数组中的元素和目标元素的比较器
 *     - 返回数字 0 表示相等
 *     - 返回数字 >0 表示应该向左侧查找
 *     - 返回数字 <0 表示应该向右侧查找
 */
export function findIndexInSortedList<T>(list: T[], comparer: (value: T) => number): number {
  let low = 0;
  let high = list.length - 1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const cmp = comparer(list[mid]);

    if (cmp === 0) {
      return mid;
    }

    if (cmp > 0) {
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return -1;
}
