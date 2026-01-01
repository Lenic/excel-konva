import type { IRegionInfo } from '../types';
import type { IDataRegion, IItemBoundary, ISheetConfig, ISheetDimension } from './types';

import { combineLatest, map, type Observable, switchMap, take } from 'rxjs';

import { BUFFER_CELL_COUNT } from '../constants';
import { binarySearch, Disposable } from '../core';

/**
 * Data region manager
 */
export class DataRegion extends Disposable implements IDataRegion {
  config: ISheetConfig;
  columnBoundary: IItemBoundary;
  rowBoundary: IItemBoundary;
  sheetDimension: ISheetDimension;

  region: IRegionInfo;
  region$: Observable<IRegionInfo>;

  /**
   * Constructor
   *
   * @param config - Sheet configuration
   * @param columnBoundary - Column boundary manager
   * @param rowBoundary - Row boundary manager
   * @param sheetDimension - Sheet dimension
   */
  constructor(
    config: ISheetConfig,
    columnBoundary: IItemBoundary,
    rowBoundary: IItemBoundary,
    sheetDimension: ISheetDimension,
  ) {
    super();
    this.config = config;
    this.columnBoundary = columnBoundary;
    this.rowBoundary = rowBoundary;
    this.sheetDimension = sheetDimension;

    this.region = { startRowIndex: 0, endRowIndex: 0, startColumnIndex: 0, endColumnIndex: 0 };

    this.region$ = this.buildDataRegion();
    this.disposeWithMe(
      this.region$.subscribe((dataRegion) => {
        this.region = dataRegion;
      }),
    );
  }

  private buildDataRegion() {
    const column$ = this.columnBoundary.getBoundary$.pipe(
      switchMap((getColumnLeft) =>
        combineLatest([this.columnBoundary.accumulated.get$, this.config.frozenColumns$]).pipe(
          take(1),
          map(
            ([getPrecedingTotalColumnWidth, frozenColumns]) =>
              [getColumnLeft, getPrecedingTotalColumnWidth, frozenColumns] as const,
          ),
        ),
      ),
    );

    const row$ = this.rowBoundary.getBoundary$.pipe(
      switchMap((getRowTop) =>
        combineLatest([this.rowBoundary.accumulated.get$, this.config.frozenRows$]).pipe(
          take(1),
          map(
            ([getPrecedingTotalRowHeight, frozenRows]) => [getRowTop, getPrecedingTotalRowHeight, frozenRows] as const,
          ),
        ),
      ),
    );

    return combineLatest([
      column$,
      row$,
      this.config.columnCount$,
      this.config.rowCount$,
      this.sheetDimension.visualSize$,
    ]).pipe(
      map(
        ([
          [getColumnLeft, getPrecedingTotalColumnWidth, frozenColumns],
          [getRowTop, getPrecedingTotalRowHeight, frozenRows],
          columnCount,
          rowCount,
          sheetVisualSize,
        ]) => {
          const [startColumnIndex, endColumnIndex] = this.findVisibleRange(
            getColumnLeft,
            frozenColumns,
            columnCount,
            getPrecedingTotalColumnWidth(frozenColumns),
            sheetVisualSize.width,
          );

          const [startRowIndex, endRowIndex] = this.findVisibleRange(
            getRowTop,
            frozenRows,
            rowCount,
            getPrecedingTotalRowHeight(frozenRows),
            sheetVisualSize.height,
          );

          return { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } as IRegionInfo;
        },
      ),
    );
  }

  /**
   * Determine the rendering range
   *
   * @param getBoundaryValue - Get the left (top) boundary value of the current row (column)
   * @param frozenCount - Number of frozen rows (columns)
   * @param totalCount - Total number of rows (columns)
   * @param viewportMin - Minimum coordinate value of the visible area
   * @param viewportMax - Maximum coordinate value of the visible area
   */
  private findVisibleRange(
    getBoundaryValue: (value: number) => number,
    frozenCount: number,
    totalCount: number,
    viewportMin: number,
    viewportMax: number,
  ) {
    /**
     * Binary search: Find the first element that becomes visible due to scrolling
     *
     * - We want to find the first `i` that satisfies `getBoundaryValue(i + 1) > 0`
     * - `getBoundaryValue(i)` returns the start position (Left/Top) of the element
     * - Since elements are continuous, `getBoundaryValue(i + 1)` is the end position (Right/Bottom) of element `i`
     */
    let start = binarySearch(
      frozenCount,
      totalCount,
      (mid) =>
        // Determine if the boundary of the current row (column) is greater than the viewport start value.
        // We need the right (bottom) boundary, so +1 is used to get the boundary of the next row (column).
        getBoundaryValue(mid + 1) - viewportMin,
      1,
    );

    /**
     * Binary search: Find the first element that leaves the viewport
     *
     * - We want to find the first `i` that satisfies `getBoundaryValue(i) > viewportSize`
     * - i.e., the start position of the element exceeds the viewport size
     */
    let end = binarySearch(
      start,
      totalCount,
      (mid) =>
        // Determine if the boundary of the current row (column) is less than the viewport end value.
        // We need the left (top) boundary, so no +1 is needed, use the element's own boundary directly.
        getBoundaryValue(mid) - viewportMax,
      -1,
    );

    // Apply buffer
    start = Math.max(frozenCount, start - BUFFER_CELL_COUNT);
    end = Math.min(totalCount, end + BUFFER_CELL_COUNT);

    return [start, end] as const;
  }
}
