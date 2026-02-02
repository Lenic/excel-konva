/**
 * Range type
 *
 * - begin: start index
 * - end: end index
 */
export type TRange = [begin: number, end: number];

/**
 * Range collection
 */
export class RangeCollection {
  private list: TRange[];

  values: TRange[];

  /**
   * Constructor
   */
  constructor() {
    this.list = [];

    this.values = [];
  }

  /**
   * Push a range
   *
   * @param range - the range
   */
  push(range: TRange): void {
    this.list.push(range);
  }

  /**
   * Clear all ranges
   */
  clear(): void {
    this.list = [];
    this.values = [];
  }

  /**
   * Merge ranges
   */
  merge(): void {
    if (this.list.length === 0) return;

    const result: TRange[] = [];
    const sorted = this.list.sort((a, b) => a[0] - b[0]);

    let [currentStart, currentEnd] = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      const [start, end] = sorted[i];

      if (start <= currentEnd) {
        currentEnd = Math.max(currentEnd, end);
      } else {
        result.push([currentStart, currentEnd]);
        currentStart = start;
        currentEnd = end;
      }
    }
    result.push([currentStart, currentEnd]);

    this.values = result;
  }
}
