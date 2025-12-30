import type { ICellRegionOptions, IRegionInfo } from '../types';

import { combineLatest, map, shareReplay, withLatestFrom } from 'rxjs';

import {
  BUFFER_CELL_COUNT,
  columnCountSubject,
  frozenColumnsSubject,
  frozenRowsSubject,
  rowCountSubject,
} from '../constants';
import { getCellGroup$ } from '../konva-items';
import { cellPool } from '../pools';

import { getCellData$, getCellRectBox$ } from './cell';
import { getColumnLeft$ } from './column';
import { getRowTop$ } from './row';
import { getColumnWidth$, getRowHeight$, sheetVisualSize$ } from './size';

function binarySearch(
  start: number,
  end: number,
  findNext: (mid: number, low: number, high: number) => [low: number, high: number],
) {
  let low = start;
  let high = end;

  while (low < high) {
    const mid = (low + high) >> 1;
    [low, high] = findNext(mid, low, high);
  }

  return low;
}

/**
 * 确定渲染范围
 *
 * @param getBoundaryValue - 获取当前行（列）的左侧（顶部）边界值
 * @param frozenCount - 被冻结的行（列）数量
 * @param totalCount - 行（列）的数量
 * @param viewportBegin - 可视区域的开始坐标值
 * @param viewportEnd - 可视区域的结束坐标值
 */
export function findVisibleRange(
  getBoundaryValue: (value: number) => number,
  frozenCount: number,
  totalCount: number,
  viewportBegin: number,
  viewportEnd: number,
) {
  /**
   * 二分查找：找到第一个由于滚动而变得可见的元素
   *
   * - 我们要寻找第一个满足 `getBoundaryValue(i + 1) > 0` 的 `i`
   * - `getBoundaryValue(i)` 返回的是元素的起始位置 (Left/Top)
   * - 因为元素连续，`getBoundaryValue(i + 1)` 即为元素 `i` 的结束位置 (Right/Bottom)
   */
  let start = binarySearch(frozenCount, totalCount, (mid, low, high) =>
    // 判断当前行（列）的边界值大于视口开始值，需要的就是右侧（底部）边界值，所以此处需要 +1 获取下一个行（列）的边界值
    getBoundaryValue(mid + 1) > viewportBegin ? [low, mid] : [mid + 1, high],
  );

  /**
   * 二分查找：找到第一个离开视口的元素
   *
   * - 我们要寻找第一个满足 `getBoundaryValue(i) > viewportSize` 的 `i`
   * - 即元素的起始位置已经超过了视口大小
   */
  let end = binarySearch(start, totalCount, (mid, low, high) =>
    // 判断当前行（列）的边界值小于视口结束值，需要的就是左侧（顶部）边界值，所以此处不需要 +1，而是直接使用自身的边界值即可
    getBoundaryValue(mid) > viewportEnd ? [low, mid] : [mid + 1, high],
  );

  // 应用缓冲区
  start = Math.max(frozenCount, start - BUFFER_CELL_COUNT);
  end = Math.min(totalCount, end + BUFFER_CELL_COUNT);

  return [start, end] as const;
}

/**
 * 可滚动的数据区域信息
 */
export const dataRegionInfo$ = combineLatest([
  getColumnLeft$.pipe(withLatestFrom(getColumnWidth$, frozenColumnsSubject)),
  columnCountSubject,
  getRowTop$.pipe(withLatestFrom(getRowHeight$, frozenRowsSubject)),
  rowCountSubject,
  sheetVisualSize$,
]).pipe(
  map(
    ([
      [getColumnLeft, getColumnWidth, frozenColumns],
      columnCount,
      [getRowTop, getRowHeight, frozenRows],
      rowCount,
      sheetVisualSize,
    ]) => {
      const [startColumnIndex, endColumnIndex] = findVisibleRange(
        getColumnLeft,
        frozenColumns,
        columnCount,
        getColumnLeft(frozenColumns - 1) + getColumnWidth(frozenColumns),
        sheetVisualSize.width,
      );

      const [startRowIndex, endRowIndex] = findVisibleRange(
        getRowTop,
        frozenRows,
        rowCount,
        getRowTop(frozenRows - 1) + getRowHeight(frozenRows),
        sheetVisualSize.height,
      );

      return { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } as IRegionInfo;
    },
  ),
);

/**
 * 绘制目标单元格
 */
export const renderCellRegion$ = combineLatest([getCellGroup$, getCellRectBox$, getCellData$]).pipe(
  map(([getCellGroup, getCellRectBox, getCellData]) => {
    /**
     * 绘制目标单元格
     *
     * @param rowIndex - 单元格所在的行索引
     * @param columnIndex - 单元格所在的列索引
     * @param options - 单元格的设置信息
     */
    return function renderCellRegion(rowIndex: number, columnIndex: number, options: ICellRegionOptions) {
      const group = getCellGroup(rowIndex, columnIndex);
      const { x, y, width, height } = getCellRectBox(rowIndex, columnIndex);

      const rect = cellPool.getRect();
      rect.setAttrs({
        ...options.rectAttrs,
        x,
        y,
        width,
        height,
      });
      if (rect.parent !== group) rect.moveTo(group);

      const text = cellPool.getText();
      text.setAttrs({
        ...options.textAttrs,
        x,
        y,
        width,
        height,
        text: getCellData(rowIndex, columnIndex),
      });
      if (text.parent !== group) text.moveTo(group);
    };
  }),
  shareReplay({ refCount: true, bufferSize: 1 }),
);
