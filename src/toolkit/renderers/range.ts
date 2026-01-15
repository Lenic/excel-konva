import type { IRangeCollection, TRange } from './types';

/**
 * Range collection
 */
export class RangeCollection implements IRangeCollection {
  private originalList: TRange[];

  values: TRange[];

  /**
   * Constructor
   */
  constructor() {
    this.originalList = [];

    this.values = [];
  }

  push(range: TRange): void {
    this.originalList.push(range);
  }

  merge(): void {
    const result: TRange[] = [];
    if (this.originalList.length !== 0) {
      const sorted = this.originalList.slice().sort((a, b) => a[0] - b[0]);

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
    }
    this.values = result;
  }
}
