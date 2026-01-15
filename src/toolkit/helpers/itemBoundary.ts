import type { IAccumulatedDimension, IItemBoundary, IItemBoundaryOptions } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, map, shareReplay, switchMap, take } from 'rxjs';

import { ObservableDisposable } from '../core';

/**
 * Item boundary
 */
export class ItemBoundary extends ObservableDisposable implements IItemBoundary {
  options: IItemBoundaryOptions;
  accumulated: IAccumulatedDimension;
  getBoundary$: Observable<(index: number) => number>;
  getItemIndex$: Observable<(clientCoordinate: number) => number>;

  /**
   * Constructor
   *
   * @param accumulated - Accumulated dimension
   * @param options - Item boundary options
   */
  constructor(accumulated: IAccumulatedDimension, options: IItemBoundaryOptions) {
    super();

    this.options = options;
    this.accumulated = accumulated;

    this.getBoundary$ = this.buildGetBoundary$();
    this.disposeWithMe(this.getBoundary$.subscribe());

    this.getItemIndex$ = this.buildGetItemIndex();
    this.disposeWithMe(this.getItemIndex$.subscribe());
  }

  private buildGetBoundary$() {
    return combineLatest([this.accumulated.get$, this.options.scrollValue$, this.options.frozenCount$]).pipe(
      map(([getPrecedingTotalDimension, scrollOffset, frozenCount]) => {
        /**
         * Get the preceding boundary for a specific index.
         *
         * @param index - The index of the item
         */
        return (index: number) => {
          if (index === 0) return 0;

          const size = getPrecedingTotalDimension(index);
          return index < frozenCount ? size : size - scrollOffset;
        };
      }),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }

  private buildGetItemIndex() {
    return combineLatest([
      this.accumulated.findIndex$.pipe(
        switchMap((getItemIndex) =>
          combineLatest([this.accumulated.get$.pipe(take(1)), this.options.frozenCount$]).pipe(
            map(
              ([getAccumulatedDimension, frozenCount]) => [getItemIndex, getAccumulatedDimension(frozenCount)] as const,
            ),
          ),
        ),
      ),
      this.options.scrollValue$,
    ]).pipe(
      map(([[getItemIndexByOffset, frozenDimension], scrollValue]) => {
        /**
         * Get the index of the item corresponding to the specified relative offset
         *
         * @param relOffset - The relative offset
         */
        return function getItemIndex(relOffset: number) {
          return relOffset <= frozenDimension
            ? getItemIndexByOffset(relOffset)
            : getItemIndexByOffset(relOffset + scrollValue);
        };
      }),
    );
  }
}
