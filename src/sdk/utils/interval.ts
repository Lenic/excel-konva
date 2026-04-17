/**
 * An tuple represents an interval.
 *
 * - begin is inclusive
 * - end is inclusive
 */
export type TInterval = [begin: number, end: number];

/**
 * Merges overlapping or adjacent intervals into non-overlapping, sorted intervals.
 *
 * @param intervals - An array of `TInterval` tuples to merge.
 * @returns A new array of merged `TInterval` tuples, sorted by start value.
 */
export function mergeIntervals(intervals: TInterval[]): TInterval[] {
  const len = intervals.length;
  if (len === 0) return [];
  if (len === 1) return [[intervals[0][0], intervals[0][1]]];

  const result: TInterval[] = [];
  const sorted = intervals.slice().sort((a, b) => a[0] - b[0]);

  let [currentBegin, currentEnd] = sorted[0];
  for (let i = 1; i < len; i++) {
    const item = sorted[i];
    if (item[0] <= currentEnd + 1) {
      if (item[1] > currentEnd) {
        currentEnd = item[1];
      }
    } else {
      result.push([currentBegin, currentEnd]);
      currentBegin = item[0];
      currentEnd = item[1];
    }
  }
  result.push([currentBegin, currentEnd]);

  return result;
}
