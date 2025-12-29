import type { IAccumulatedDimension, IItemBoundary, IScrollOffset, ISheetMeta } from './types';

import { combineLatest, map, type Observable, shareReplay } from 'rxjs';

import { Disposable } from '../core';

/**
 * Item boundary
 */
export class ItemBoundary extends Disposable implements IItemBoundary {
  offset: IScrollOffset;
  column: IAccumulatedDimension;
  row: IAccumulatedDimension;
  sheet: ISheetMeta;

  getColumnLeft$: Observable<(index: number) => number>;
  getRowTop$: Observable<(index: number) => number>;

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
    sheet: ISheetMeta,
  ) {
    super();

    this.offset = scrollOffset;
    this.column = accumulatedColumnDimension;
    this.row = accumulatedRowDimension;
    this.sheet = sheet;

    this.getColumnLeft$ = this.buildPrecedingBoundary$(
      accumulatedColumnDimension.get$,
      scrollOffset.scrollLeft$,
      sheet.frozenColumns$,
    );
    this.disposeWithMe(this.getColumnLeft$.subscribe());

    this.getRowTop$ = this.buildPrecedingBoundary$(
      accumulatedRowDimension.get$,
      scrollOffset.scrollTop$,
      sheet.frozenRows$,
    );
    this.disposeWithMe(this.getRowTop$.subscribe());
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
