import type { IAccumulatedDimension, IItemDimension } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, map, shareReplay } from 'rxjs';

import { binarySearch, Disposable } from '../core';

/**
 * Accumulated dimension
 */
export class AccumulatedDimension extends Disposable implements IAccumulatedDimension {
  store: Map<number, number>;
  dimension: IItemDimension;

  get$: Observable<(index: number) => number>;
  findIndex$: Observable<(offset: number) => number>;

  /**
   * Constructor
   *
   * @param dimension - Item dimension manager
   * @param count$ - Observable count
   */
  constructor(dimension: IItemDimension, count$: Observable<number>) {
    super();

    this.store = new Map();
    this.disposeWithMe(() => {
      this.store.clear();
    });

    this.dimension = dimension;

    this.get$ = this.buildGet();
    this.disposeWithMe(this.get$.subscribe());

    this.findIndex$ = this.buildFindIndex(count$);
    this.disposeWithMe(this.findIndex$.subscribe());
  }

  private buildGet(): Observable<(index: number) => number> {
    return this.dimension.get$.pipe(
      map((getDimension) => {
        this.store.clear();
        this.store.set(0, 0);

        /**
         * The maximum index of the item in the cache
         */
        let maxIndex = 0;

        /**
         * Get the cumulative size of the items in the range `[0, index)`
         *
         * @param index - The index of the item, starting from the number 0
         */
        return (index: number) => {
          const value = this.store.get(index);
          if (value !== undefined) return value;

          let currentValue = this.store.get(maxIndex) ?? 0;
          for (let c = maxIndex; c < index; c++) {
            const nextValue = currentValue + getDimension(c);

            maxIndex = c + 1;
            this.store.set(maxIndex, nextValue);

            currentValue = nextValue;
          }

          return currentValue;
        };
      }),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }

  private buildFindIndex(count$: Observable<number>): Observable<(offset: number) => number> {
    return combineLatest([this.get$, count$]).pipe(
      map(([getPrecedingTotalDimension, count]) => {
        const list: [beginValue: number, endValue: number][] = [];
        let maxIndex = -1;

        /**
         * Find the item index for a specific offset.
         *
         * @param offset - The offset.
         */
        return function findIndex(offset: number) {
          const index = binarySearch(0, list.length - 1, (mid) => {
            const [beginValue, endValue] = list[mid];
            if (beginValue <= offset && offset < endValue) return 0;
            return beginValue > offset ? 1 : -1;
          });
          if (index !== -1) return index;

          let itemIndex = -1;
          for (let c = maxIndex + 1; c < count; c++) {
            const beginValue = getPrecedingTotalDimension(c);
            const endValue = getPrecedingTotalDimension(c + 1);

            maxIndex = c;
            list.push([beginValue, endValue]);

            if (offset < endValue) {
              itemIndex = c;
              break;
            }
          }
          return Math.max(0, Math.min(itemIndex, count - 1));
        };
      }),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }
}
