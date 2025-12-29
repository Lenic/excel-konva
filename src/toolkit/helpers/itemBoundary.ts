import type { IAccumulatedDimension, IItemBoundary, IScrollOffset, ISheetMeta } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, map, shareReplay } from 'rxjs';

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
   * @param offset - Scroll offset
   * @param column - Accumulated column dimension
   * @param row - Accumulated row dimension
   * @param sheet - Sheet
   */
  constructor(offset: IScrollOffset, column: IAccumulatedDimension, row: IAccumulatedDimension, sheet: ISheetMeta) {
    super();

    this.offset = offset;
    this.column = column;
    this.row = row;
    this.sheet = sheet;

    this.getColumnLeft$ = this.buildPrecedingBoundary$(column.get$, offset.scrollLeft$, sheet.frozenColumns$);
    this.disposeWithMe(this.getColumnLeft$.subscribe());

    this.getRowTop$ = this.buildPrecedingBoundary$(row.get$, offset.scrollTop$, sheet.frozenRows$);
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
          return index < frozenCount ? size : Math.max(0, size - scrollOffset);
        };
      }),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }
}
