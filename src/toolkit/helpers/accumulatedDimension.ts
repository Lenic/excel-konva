import type { IAccumulatedDimension, IDimensionManager } from './types';
import type { Observable } from 'rxjs';

import { map, shareReplay } from 'rxjs';

import { Disposable } from '../core';

/**
 * Accumulated dimension
 */
export class AccumulatedDimension extends Disposable implements IAccumulatedDimension {
  accumulatedStore: Map<number, number>;
  dimensionManager: IDimensionManager;

  getPrecedingTotalDimension$: Observable<(index: number) => number>;

  /**
   * Constructor
   *
   * @param dimensionManager - Dimension manager
   */
  constructor(dimensionManager: IDimensionManager) {
    super();

    this.accumulatedStore = new Map();
    this.disposeWithMe(() => {
      this.accumulatedStore.clear();
    });
    this.dimensionManager = dimensionManager;

    this.getPrecedingTotalDimension$ = this.rebuild();
    this.disposeWithMe(this.getPrecedingTotalDimension$.subscribe());
  }

  private rebuild(): Observable<(index: number) => number> {
    return this.dimensionManager.getDimension$.pipe(
      map((getDimension) => {
        this.accumulatedStore.clear();

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
          const value = this.accumulatedStore.get(index);
          if (value !== undefined) return value;

          let currentValue = this.accumulatedStore.get(maxIndex) ?? 0;
          for (let c = maxIndex; c < index; c++) {
            const nextValue = currentValue + getDimension(c);

            maxIndex = c + 1;
            this.accumulatedStore.set(maxIndex, nextValue);

            currentValue = nextValue;
          }

          return currentValue;
        };
      }),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }
}
