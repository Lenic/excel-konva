import type { IAccumulatedDimension, IItemDimension } from './types';
import type { Observable } from 'rxjs';

import { map, shareReplay } from 'rxjs';

import { Disposable } from '../core';

/**
 * Accumulated dimension
 */
export class AccumulatedDimension extends Disposable implements IAccumulatedDimension {
  store: Map<number, number>;
  dimension: IItemDimension;

  get$: Observable<(index: number) => number>;

  /**
   * Constructor
   *
   * @param itemDimension - Dimension manager
   */
  constructor(itemDimension: IItemDimension) {
    super();

    this.store = new Map();
    this.disposeWithMe(() => {
      this.store.clear();
    });
    this.dimension = itemDimension;

    this.get$ = this.build();
    this.disposeWithMe(this.get$.subscribe());
  }

  private build(): Observable<(index: number) => number> {
    return this.dimension.get$.pipe(
      map((getDimension) => {
        this.store.clear();

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
}
