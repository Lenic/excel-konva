import type { IAccumulatedDimension, IItemBoundaryManager, IScrollOffset, ISheet } from './types';

import { combineLatest, map, type Observable, shareReplay } from 'rxjs';

import { Disposable } from '../core';

/**
 * Item boundary manager
 */
export class ItemBoundaryManager extends Disposable implements IItemBoundaryManager {
  readonly scrollOffset: IScrollOffset;
  readonly accumulatedColumnDimension: IAccumulatedDimension;
  readonly accumulatedRowDimension: IAccumulatedDimension;
  readonly sheet: ISheet;

  readonly getColumnPrecedingBoundary$: Observable<(index: number) => number>;
  readonly getRowPrecedingBoundary$: Observable<(index: number) => number>;

  /**
   * Constructor
   *
   * @param boundaryType - Boundary type
   * @param scrollOffset - Scroll offset
   * @param accumulatedColumnDimension - Accumulated column dimension
   * @param accumulatedRowDimension - Accumulated row dimension
   * @param sheet - Sheet
   */
  constructor(
    scrollOffset: IScrollOffset,
    accumulatedColumnDimension: IAccumulatedDimension,
    accumulatedRowDimension: IAccumulatedDimension,
    sheet: ISheet,
  ) {
    super();

    this.scrollOffset = scrollOffset;
    this.accumulatedColumnDimension = accumulatedColumnDimension;
    this.accumulatedRowDimension = accumulatedRowDimension;
    this.sheet = sheet;

    this.getColumnPrecedingBoundary$ = this.buildPrecedingBoundary$(
      accumulatedColumnDimension.getPrecedingTotalDimension$,
      scrollOffset.scrollLeft$,
      sheet.frozenColumns$,
    );
    this.disposeWithMe(this.getColumnPrecedingBoundary$.subscribe());

    this.getRowPrecedingBoundary$ = this.buildPrecedingBoundary$(
      accumulatedRowDimension.getPrecedingTotalDimension$,
      scrollOffset.scrollTop$,
      sheet.frozenRows$,
    );
    this.disposeWithMe(this.getRowPrecedingBoundary$.subscribe());
  }

  private buildPrecedingBoundary$(
    getPrecedingTotalDimension$: Observable<(index: number) => number>,
    scrollValue$: Observable<number>,
    frozenCount$: Observable<number>,
  ) {
    return combineLatest([getPrecedingTotalDimension$, scrollValue$, frozenCount$]).pipe(
      map(([getPrecedingTotalDimension, scrollOffset, frozenCount]) => {
        /**
         * Get the coordinate value of the left edge of the specified item (relative to the Canvas)
         *
         * @param index - The index of the item, starting from the number 0
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
}
