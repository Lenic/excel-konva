import type { IRegionInfo } from '../types';
import type { IAccumulatedDimension, IDataRegion, IItemBoundary, ISheetConfig, ISheetDimension } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, map, switchMap, take } from 'rxjs';

import { binarySearch, ObservableDisposable } from '../core';

/**
 * Data region manager
 */
export class DataRegion extends ObservableDisposable implements IDataRegion {
  private rowAccumulated: IAccumulatedDimension;
  private columnAccumulated: IAccumulatedDimension;

  config: ISheetConfig;
  columnBoundary: IItemBoundary;
  rowBoundary: IItemBoundary;
  sheetDimension: ISheetDimension;

  region: IRegionInfo;
  region$: Observable<IRegionInfo>;

  /**
   * DataRegion constructor
   *
   * @param rowAccumulated - The accumulated dimension manager for rows
   * @param columnAccumulated - The accumulated dimension manager for columns
   * @param rowBoundary - The boundary manager for rows
   * @param columnBoundary - The boundary manager for columns
   * @param config - The sheet configuration
   * @param sheetDimension - The overall sheet dimension manager
   */
  constructor(
    rowAccumulated: IAccumulatedDimension,
    columnAccumulated: IAccumulatedDimension,
    rowBoundary: IItemBoundary,
    columnBoundary: IItemBoundary,
    config: ISheetConfig,
    sheetDimension: ISheetDimension,
  ) {
    super();

    this.rowAccumulated = rowAccumulated;
    this.columnAccumulated = columnAccumulated;
    this.rowBoundary = rowBoundary;
    this.columnBoundary = columnBoundary;
    this.config = config;
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
        combineLatest([this.columnAccumulated.get$, this.config.get$('frozenColumns')]).pipe(
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
        combineLatest([this.rowAccumulated.get$, this.config.get$('frozenRows')]).pipe(
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
      this.config.get$('columnCount'),
      this.config.get$('rowCount'),
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
      this.withPublish(),
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
      (mid) => {
        const endValue = getBoundaryValue(mid + 1);
        const beginValue = getBoundaryValue(mid);
        if (endValue < viewportMin) {
          return -1;
        } else if (beginValue > viewportMin) {
          return 1;
        } else {
          return 0;
        }
      },
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
      (mid) => {
        const endValue = getBoundaryValue(mid + 1);
        const beginValue = getBoundaryValue(mid);
        if (endValue < viewportMax) {
          return -1;
        } else if (beginValue > viewportMax) {
          return 1;
        } else {
          return 0;
        }
      },
      -1,
    );

    // Apply buffer
    start = Math.max(frozenCount, start);
    end = Math.min(totalCount, end);

    return [start, end] as const;
  }
}
