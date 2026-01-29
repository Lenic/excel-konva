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
  private map: Map<string, TRange>;

  values: TRange[];

  /**
   * Constructor
   */
  constructor() {
    this.map = new Map<string, TRange>();

    this.values = [];
  }

  /**
   * Push a range
   *
   * @param key - the range key
   * @param range - the range
   */
  push(key: string, range: TRange): void {
    this.map.set(key, range);
  }

  /**
   * Remove a range
   *
   * @param key - the range key
   */
  remove(key: string): void {
    this.map.delete(key);
  }

  /**
   * Clear all ranges
   */
  clear(): void {
    this.map.clear();
  }

  /**
   * Merge ranges
   */
  merge(): void {
    if (this.map.size === 0) return;

    const result: TRange[] = [];
    const sorted = Array.from(this.map.values()).sort((a, b) => a[0] - b[0]);

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
