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
  if (begin > end) return -1;

  const resBegin = comparer(begin);
  if (resBegin === 0) return begin;
  if (resBegin > 0) {
    return exact > 0 ? begin : -1;
  }

  const resEnd = comparer(end);
  if (resEnd === 0) return end;
  if (resEnd < 0) {
    return exact < 0 ? end : -1;
  }

  let left = begin + 1;
  let right = end - 1;

  let candidate = exact > 0 ? end : exact < 0 ? begin : -1;

  while (left <= right) {
    const mid = left + ((right - left) >> 1);
    const result = comparer(mid);

    if (result === 0) {
      return mid;
    } else if (result < 0) {
      if (exact < 0) candidate = mid;
      left = mid + 1;
    } else {
      if (exact > 0) candidate = mid;
      right = mid - 1;
    }
  }

  return exact === 0 ? -1 : candidate;
}
