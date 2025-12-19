import { combineLatest, map, shareReplay, withLatestFrom } from 'rxjs';

import { frozenRowsSubject, rowCountSubject } from '../constants';

import { findIndexInSortedList } from './core';
import { scrollOffset$ } from './scroll';
import { getRowHeight$ } from './size';

/**
 * 获取 `[0, colIndex)` 行的累计高度
 */
export const getPrecedingRowsHeight$ = getRowHeight$.pipe(
  map((getRowHeight) => {
    /**
     * 『行索引、累计高度』映射缓存
     */
    const cacheMap = new Map<number, number>();
    /**
     * 缓存中列索引的最大值
     */
    let maxIndex = 0;

    /**
     * 获取 `[0, colIndex)` 行的累计高度
     *
     * @param rowIndex - 行的索引，从数字 0 开始
     */
    return function getPrecedingRowsHeight(rowIndex: number) {
      const value = cacheMap.get(rowIndex);
      if (value !== undefined) return value;

      let currentValue = cacheMap.get(maxIndex) ?? 0;
      for (let c = maxIndex; c < rowIndex; c++) {
        const nextValue = currentValue + getRowHeight(c);

        maxIndex = c + 1;
        cacheMap.set(maxIndex, nextValue);

        currentValue = nextValue;
      }

      return currentValue;
    };
  }),
  shareReplay({ refCount: true, bufferSize: 1 }),
);

/**
 * 获取指定行顶部边缘的 Y 坐标（相对于 Canvas 顶部）
 */
export const getRowTop$ = combineLatest([getPrecedingRowsHeight$, scrollOffset$, frozenRowsSubject]).pipe(
  map(([getPrecedingRowsHeight, scrollOffset, frozenRows]) => {
    /**
     * 获取指定列左侧边缘的 X 坐标（相对于 Canvas 顶部）
     *
     * @param rowIndex - 列的索引，从数字 0 开始
     */
    return function getRowTop(rowIndex: number) {
      if (rowIndex === 0) return 0;

      const top = getPrecedingRowsHeight(rowIndex);
      // 冻结列不需要考虑横向滚动
      return rowIndex < frozenRows ? top : top - scrollOffset.deltaY;
    };
  }),
  shareReplay({ refCount: true, bufferSize: 1 }),
);

/**
 * 根据鼠标所在的 Y 坐标获取行的索引
 */
export const getRowIndex$ = combineLatest([
  getPrecedingRowsHeight$.pipe(withLatestFrom(getRowHeight$)),
  rowCountSubject,
]).pipe(
  map(([[getPrecedingRowsHeight, getRowHeight], rowCount]) => {
    /**
     * 『行索引、业务数据』映射缓存
     *
     * - 业务数据：行顶部边缘 Y、行底部边缘 Y
     * - Map 中项添加的顺序是按照升序排列的
     */
    const cacheMap = new Map<number, [number, number]>();
    /**
     * 列表中行索引的最大值
     */
    let maxIndex = -1;

    /**
     * 根据鼠标所在的 Y 坐标获取行的索引
     *
     * @param y - 鼠标所在的 Y 坐标值（相对于 Canvas 顶部）
     */
    return function getColumnIndex(y: number) {
      const index = findIndexInSortedList(Array.from(cacheMap.entries()), ([_, [left, right]]) => {
        if (left <= y && y < right) return 0;
        return left > y ? 1 : -1;
      });
      if (index !== -1) return index;

      let colIndex = -1;
      for (let r = maxIndex + 1; r < rowCount; r++) {
        const topY = getPrecedingRowsHeight(r);
        const bottomY = topY + getRowHeight(r);

        maxIndex = r;
        cacheMap.set(r, [topY, bottomY]);

        if (y < bottomY) {
          colIndex = r;
          break;
        }
      }
      return Math.max(0, Math.min(colIndex, rowCount - 1));
    };
  }),
  shareReplay({ refCount: true, bufferSize: 1 }),
);
