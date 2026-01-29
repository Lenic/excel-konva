import type { IRangeCollection, TRange } from './types';

/**
 * Range collection
 */
export class RangeCollection implements IRangeCollection {
  private map: Map<string, TRange>;

  values: TRange[];

  /**
   * Constructor
   */
  constructor() {
    this.map = new Map<string, TRange>();

    this.values = [];
  }

  push(key: string, range: TRange): void {
    this.map.set(key, range);
  }

  remove(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

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
