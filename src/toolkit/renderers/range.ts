import type { IRangeCollection, TRange } from './types';

/**
 * Range collection
 */
export class RangeCollection implements IRangeCollection {
  private originalList: TRange[];
  private processedList: TRange[];

  /**
   * Constructor
   */
  constructor() {
    this.originalList = [];
    this.processedList = [];
  }

  get values(): TRange[] {
    if (this.processedList.length !== this.originalList.length) {
      this.processedList = this.mergeRanges(this.originalList);
    }
    return this.processedList;
  }

  push(range: TRange): void {
    this.originalList.push(range);

    if (this.processedList.length > 0) {
      this.processedList = [];
    }
  }

  private mergeRanges(ranges: TRange[]): TRange[] {
    const result: TRange[] = [];
    if (ranges.length === 0) return result;

    const sorted = ranges.slice().sort((a, b) => a[0] - b[0]);

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

    return result;
  }
}
