import { combineLatest, map, shareReplay, withLatestFrom } from 'rxjs';

import { columnCountSubject, frozenColumnsSubject } from '../constants';

import { findIndexInSortedList } from './core';
import { scrollOffset$ } from './scroll';
import { getColumnWidth$ } from './size';

/**
 * 获取 `[0, colIndex)` 列的累计宽度
 */
export const getPrecedingColumnsWidth$ = getColumnWidth$.pipe(
  map((getColWidth) => {
    /**
     * 『列索引、累计宽度』映射缓存
     */
    const cacheMap = new Map<number, number>();
    /**
     * 缓存中列索引的最大值
     */
    let maxIndex = 0;

    /**
     * 获取 `[0, colIndex)` 列的累计宽度
     *
     * @param colIndex - 列的索引，从数字 0 开始
     */
    return function getPrecedingColumnsWidth(colIndex: number) {
      const value = cacheMap.get(colIndex);
      if (value !== undefined) return value;

      let currentValue = cacheMap.get(maxIndex) ?? 0;
      for (let c = maxIndex; c < colIndex; c++) {
        const nextValue = currentValue + getColWidth(c);

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
 * 获取指定列左侧边缘的 X 坐标（相对于 Canvas 最左侧）
 */
export const getColumnLeft$ = combineLatest([getPrecedingColumnsWidth$, scrollOffset$, frozenColumnsSubject]).pipe(
  map(([getPrecedingColumnsWidth, scrollOffset, frozenColumns]) => {
    /**
     * 获取指定列左侧边缘的 X 坐标（相对于 Canvas 最左侧）
     *
     * @param colIndex - 列的索引，从数字 0 开始
     */
    return function getColumnLeft(colIndex: number) {
      if (colIndex === 0) return 0;

      const left = getPrecedingColumnsWidth(colIndex);
      // 冻结列不需要考虑横向滚动
      return colIndex < frozenColumns ? left : left - scrollOffset.deltaX;
    };
  }),
  shareReplay({ refCount: true, bufferSize: 1 }),
);

/**
 * 根据鼠标所在的 X 坐标获取列的索引
 */
export const getColumnIndex$ = combineLatest([
  getPrecedingColumnsWidth$.pipe(withLatestFrom(getColumnWidth$)),
  columnCountSubject,
]).pipe(
  map(([[getPrecedingColumnsWidth, getColumnWidth], columnCount]) => {
    /**
     * 『列索引、业务数据』映射缓存
     *
     * - 业务数据：列左侧边缘 X、列右侧边缘 X
     * - Map 中项添加的顺序是按照升序排列的
     */
    const cacheMap = new Map<number, [number, number]>();
    /**
     * 列表中列索引的最大值
     */
    let maxIndex = -1;

    /**
     * 根据鼠标所在的 X 坐标获取列的索引
     *
     * @param x - 鼠标所在的 X 坐标值（相对于 Canvas 最左侧）
     */
    return function getColumnIndex(x: number) {
      const index = findIndexInSortedList(Array.from(cacheMap.entries()), ([_, [left, right]]) => {
        if (left <= x && x < right) return 0;
        return left > x ? 1 : -1;
      });
      if (index !== -1) return index;

      let colIndex = -1;
      for (let c = maxIndex + 1; c < columnCount; c++) {
        const leftX = getPrecedingColumnsWidth(c);
        const rightX = leftX + getColumnWidth(c);

        maxIndex = c;
        cacheMap.set(c, [leftX, rightX]);

        if (x < rightX) {
          colIndex = c;
          break;
        }
      }
      return Math.max(0, Math.min(colIndex, columnCount - 1));
    };
  }),
  shareReplay({ refCount: true, bufferSize: 1 }),
);
