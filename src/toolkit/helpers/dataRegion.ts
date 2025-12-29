import type { IRegionInfo } from '../types';
import type { IDataRegion, IItemBoundary, ISheetDimension, ISheetMeta } from './types';

import { combineLatest, map, type Observable, of, pairwise, startWith, switchMap, withLatestFrom } from 'rxjs';

import { BUFFER_CELL_COUNT } from '../constants';
import { binarySearch, Disposable } from '../core';

export class DataRegion extends Disposable implements IDataRegion {
  sheet: ISheetMeta;
  boundary: IItemBoundary;
  sheetDimension: ISheetDimension;

  region: IRegionInfo;
  region$: Observable<IRegionInfo>;

  constructor(sheet: ISheetMeta, itemBoundary: IItemBoundary, sheetDimension: ISheetDimension) {
    super();
    this.sheet = sheet;
    this.boundary = itemBoundary;
    this.sheetDimension = sheetDimension;

    this.region = { startRow: 0, endRow: 0, startColumn: 0, endColumn: 0 };

    this.region$ = this.buildDataRegion();
    this.disposeWithMe(
      this.region$.subscribe((dataRegion) => {
        this.region = dataRegion;
      }),
    );
  }

  private buildDataRegion() {
    type ItemDataType = [
      [(index: number) => number, (columnIndex: number) => number],
      [number, (columnIndex: number) => number],
      [number, (columnIndex: number) => number],
    ];
    function convert(obs: Observable<ItemDataType>) {
      return obs.pipe(
        startWith(null),
        pairwise(),
        switchMap(([prev, x]) => {
          const curr = x as unknown as Exclude<typeof x, null>;

          // order: getPrecedingTotal<XX>, get<XX>, frozen<XX>
          if (!prev || prev[0] !== curr[0]) return of([...curr[0], curr[1][0]] as const);
          if (prev[1] !== curr[1]) return of([curr[0][0], curr[1][1], curr[1][0]] as const);

          return of([curr[0][0], curr[2][1], curr[1][0]] as const);
        }),
      );
    }

    const column$ = convert(
      combineLatest([
        this.boundary.column.get$.pipe(withLatestFrom(this.boundary.getColumnLeft$)),
        this.sheet.frozenColumns$.pipe(withLatestFrom(this.boundary.getColumnLeft$)),
        this.boundary.offset.scrollLeft$.pipe(withLatestFrom(this.boundary.getColumnLeft$)),
      ]),
    );

    const row$ = convert(
      combineLatest([
        this.boundary.row.get$.pipe(withLatestFrom(this.boundary.getRowTop$)),
        this.sheet.frozenRows$.pipe(withLatestFrom(this.boundary.getRowTop$)),
        this.boundary.offset.scrollTop$.pipe(withLatestFrom(this.boundary.getRowTop$)),
      ]),
    );

    return combineLatest([
      column$,
      row$,
      this.sheet.columnCount$,
      this.sheet.rowCount$,
      this.sheetDimension.visualSize$,
    ]).pipe(
      map(
        ([
          [getPrecedingTotalColumnWidth, getColumnLeft, frozenColumns],
          [getPrecedingTotalRowHeight, getRowTop, frozenRows],
          columnCount,
          rowCount,
          sheetVisualSize,
        ]) => {
          const [startColumn, endColumn] = this.findVisibleRange(
            getColumnLeft,
            frozenColumns,
            columnCount,
            getPrecedingTotalColumnWidth(frozenColumns),
            sheetVisualSize.width,
          );

          const [startRow, endRow] = this.findVisibleRange(
            getRowTop,
            frozenRows,
            rowCount,
            getPrecedingTotalRowHeight(frozenRows),
            sheetVisualSize.height,
          );

          return { startRow, endRow, startColumn, endColumn } as IRegionInfo;
        },
      ),
    );
  }

  /**
   * 确定渲染范围
   *
   * @param getBoundaryValue - 获取当前行（列）的左侧（顶部）边界值
   * @param frozenCount - 被冻结的行（列）数量
   * @param totalCount - 行（列）的数量
   * @param viewportMin - 可视区域的最小坐标值
   * @param viewportMax - 可视区域的最大坐标值
   */
  private findVisibleRange(
    getBoundaryValue: (value: number) => number,
    frozenCount: number,
    totalCount: number,
    viewportMin: number,
    viewportMax: number,
  ) {
    /**
     * 二分查找：找到第一个由于滚动而变得可见的元素
     *
     * - 我们要寻找第一个满足 `getBoundaryValue(i + 1) > 0` 的 `i`
     * - `getBoundaryValue(i)` 返回的是元素的起始位置 (Left/Top)
     * - 因为元素连续，`getBoundaryValue(i + 1)` 即为元素 `i` 的结束位置 (Right/Bottom)
     */
    let start = binarySearch(
      frozenCount,
      totalCount,
      (mid) =>
        // 判断当前行（列）的边界值大于视口开始值，需要的就是右侧（底部）边界值，所以此处需要 +1 获取下一个行（列）的边界值
        getBoundaryValue(mid + 1) - viewportMin,
      1,
    );

    /**
     * 二分查找：找到第一个离开视口的元素
     *
     * - 我们要寻找第一个满足 `getBoundaryValue(i) > viewportSize` 的 `i`
     * - 即元素的起始位置已经超过了视口大小
     */
    let end = binarySearch(
      start,
      totalCount,
      (mid) =>
        // 判断当前行（列）的边界值小于视口结束值，需要的就是左侧（顶部）边界值，所以此处不需要 +1，而是直接使用自身的边界值即可
        getBoundaryValue(mid) - viewportMax,
      1,
    );

    // 应用缓冲区
    start = Math.max(frozenCount, start - BUFFER_CELL_COUNT);
    end = Math.min(totalCount, end + BUFFER_CELL_COUNT);

    return [start, end] as const;
  }
}
