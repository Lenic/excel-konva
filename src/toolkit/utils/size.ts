import type { IDimension } from '../types';

import { combineLatest, fromEvent, map, scan, shareReplay, startWith, Subject } from 'rxjs';

import {
  CELL_HEIGHT,
  CELL_WIDTH,
  columnCountSubject,
  HEADER_COL_INDEX,
  HEADER_HEIGHT,
  HEADER_ROW_INDEX,
  HEADER_WIDTH,
  MIN_CELL_HEIGHT,
  MIN_CELL_WIDTH,
  rowCountSubject,
} from '../constants';
import { container } from '../core-elements';

const columnWidthSubject = new Subject<[number, number | null]>();

/**
 * 设置指定列的宽度
 *
 * - 行头列的默认宽度为 `HEADER_WIDTH = 40`
 * - 其余列的默认宽度为 `CELL_WIDTH = 100`
 *
 * @param columnIndex - 列的索引，从数字 0 开始
 * @param value - 列的宽度
 *     - 注意列的宽度必须大于数字 0
 *     - 小于等于数字 0 的宽度会被忽略
 */
export function setColumnWidth(columnIndex: number, value: number) {
  if (value < MIN_CELL_WIDTH) return;
  columnWidthSubject.next([columnIndex, value]);
}

/**
 * 重置指定列的宽度，恢复到默认值
 *
 * - 行头列的默认宽度为 `HEADER_WIDTH = 40`
 * - 其余列的默认宽度为 `CELL_WIDTH = 100`
 *
 * @param columnIndex - 列的索引，从数字 0 开始
 */
export function resetColumnWidth(columnIndex: number) {
  columnWidthSubject.next([columnIndex, null]);
}

/**
 * 获取指定列的宽度
 */
export const getColumnWidth$ = columnWidthSubject.pipe(
  startWith(null),
  scan((map, item) => {
    if (item === null) return map;

    const [key, value] = item;
    if (value === null) {
      map.delete(key);
    } else {
      map.set(key, value);
    }

    return map;
  }, new Map<number, number>()),
  map((store) => {
    /**
     * 获取指定列的宽度
     *
     * @param columnIndex - 列的索引，从数字 0 开始
     */
    return function getColumnWidth(columnIndex: number) {
      const value = store.get(columnIndex);
      if (value !== undefined) return value;

      return columnIndex === HEADER_COL_INDEX ? HEADER_WIDTH : CELL_WIDTH;
    };
  }),
  shareReplay({ bufferSize: 1, refCount: true }),
);

const rowHeightSubject = new Subject<[number, number | null]>();

/**
 * 设置指定行的高度
 *
 * - 列头行的默认高度为 `HEADER_HEIGHT = 30`
 * - 其余行的默认高度为 `CELL_HEIGHT = 28`
 *
 * @param rowIndex - 行的索引，从数字 0 开始
 * @param value - 行的高度
 *     - 注意行的高度必须大于数字 0
 *     - 小于等于数字 0 的宽度会被忽略
 */
export function setRowHeight(rowIndex: number, value: number) {
  if (value < MIN_CELL_HEIGHT) return;
  rowHeightSubject.next([rowIndex, value]);
}

/**
 * 设置指定行的高度
 *
 * - 列头行的默认高度为 `HEADER_HEIGHT = 30`
 * - 其余行的默认高度为 `CELL_HEIGHT = 28`
 *
 * @param rowIndex - 行的索引，从数字 0 开始
 */
export function resetRowHeight(rowIndex: number) {
  rowHeightSubject.next([rowIndex, null]);
}

/**
 * 获取指定行的高度
 */
export const getRowHeight$ = rowHeightSubject.pipe(
  startWith(null),
  scan((map, item) => {
    if (item === null) return map;

    const [key, value] = item;
    if (value === null) {
      map.delete(key);
    } else {
      map.set(key, value);
    }

    return map;
  }, new Map<number, number>()),
  map((store) => {
    /**
     * 获取指定行的高度
     *
     * @param rowIndex - 行的索引，从数字 0 开始
     */
    return function getRowHeight(rowIndex: number) {
      const value = store.get(rowIndex);
      if (value !== undefined) return value;

      return rowIndex === HEADER_ROW_INDEX ? HEADER_HEIGHT : CELL_HEIGHT;
    };
  }),
  shareReplay({ bufferSize: 1, refCount: true }),
);

/**
 * 获取表格的可视大小
 */
export const sheetVisualSize$ = fromEvent(window, 'resize').pipe(
  startWith(null),
  map(() => ({ width: container.clientWidth, height: container.clientHeight }) as IDimension),
  shareReplay({ refCount: true, bufferSize: 1 }),
);

/**
 * 获取表格的真实大小
 */
export const sheetRealSize$ = combineLatest([rowCountSubject, columnCountSubject, getColumnWidth$, getRowHeight$]).pipe(
  map(([rowCount, columnCount, getColumnWidth, getRowHeight]) => {
    let width = 0;
    for (let c = 0; c < columnCount; c++) {
      width += getColumnWidth(c);
    }

    let height = 0;
    for (let r = 0; r < rowCount; r++) {
      height += getRowHeight(r);
    }

    return { width, height } as IDimension;
  }),
  shareReplay({ refCount: true, bufferSize: 1 }),
);
