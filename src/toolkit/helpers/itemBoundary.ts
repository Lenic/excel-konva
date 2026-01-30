import type { IAccumulatedDimension, IItemBoundary, IItemBoundaryOptions } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, map, switchMap, take } from 'rxjs';

import { ObservableDisposable } from '../core';

/**
 * Item boundary
 */
export class ItemBoundary extends ObservableDisposable implements IItemBoundary {
  private itemAccumulated: IAccumulatedDimension;

  options: IItemBoundaryOptions;

  getBoundary$: Observable<(index: number) => number>;
  getItemIndex$: Observable<(clientCoordinate: number) => number>;

  /**
   * ItemBoundary constructor
   *
   * @param itemAccumulated - The accumulated dimension manager used to calculate boundary positions
   * @param options - The item boundary options containing scroll and frozen information
   */
  constructor(itemAccumulated: IAccumulatedDimension, options: IItemBoundaryOptions) {
    super();

    this.itemAccumulated = itemAccumulated;
    this.options = options;

    this.getBoundary$ = this.buildGetBoundary$();
    this.disposeWithMe(this.getBoundary$.subscribe());

    this.getItemIndex$ = this.buildGetItemIndex();
    this.disposeWithMe(this.getItemIndex$.subscribe());
  }

  private buildGetBoundary$() {
    return combineLatest([this.itemAccumulated.get$, this.options.scrollValue$, this.options.frozenCount$]).pipe(
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
      this.withPublish(),
    );
  }

  private buildGetItemIndex() {
    return combineLatest([
      this.itemAccumulated.findIndex$.pipe(
        switchMap((getItemIndex) =>
          combineLatest([this.itemAccumulated.get$.pipe(take(1)), this.options.frozenCount$]).pipe(
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
      this.withPublish(),
    );
  }
}
