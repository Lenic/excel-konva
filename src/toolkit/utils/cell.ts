import type { ILocation, IPoint, IRectBox } from '../types';

import { combineLatest, map, scan, shareReplay, startWith, Subject, withLatestFrom } from 'rxjs';

import { HEADER_COL_INDEX, HEADER_ROW_INDEX } from '../constants';
import { container } from '../core-elements';

import { getColumnIndex$, getColumnLeft$ } from './column';
import { getCellKey, getColumnLabel } from './core';
import { getRowIndex$, getRowTop$ } from './row';
import { scrollOffset$ } from './scroll';
import { getColumnWidth$, getRowHeight$ } from './size';

const cellDataSubject = new Subject<[string, string | null]>();

/**
 * 设置给定单元格的内容
 *
 * @param key - 单元格的 Key
 * @param value - 单元格的值，`null` 表示清除单元格的内容，将其设置为初始值 `undefined`
 */
export function setCellData(key: string, value: string | null): void;
/**
 * 设置给定单元格的内容
 *
 * @param rowIndex - 行的索引，从数字 0 开始
 * @param columnIndex - 列的索引，从数字 0 开始
 * @param value - 单元格的值，`null` 表示清除单元格的内容，将其设置为初始值 `undefined`
 */
export function setCellData(rowIndex: number, columnIndex: number, value: string | null): void;

/**
 * @internal `setCellData` 方法具体实现
 */
export function setCellData(...args: any[]) {
  if (args.length === 2) {
    cellDataSubject.next(args as [string, string | null]);
  } else {
    cellDataSubject.next([getCellKey(args[0] as number, args[1] as number), args[2]] as [string, string | null]);
  }
}

/**
 * 获取给定单元格的内容
 */
export const getCellData$ = cellDataSubject.pipe(
  startWith(null),
  scan(
    (acc, item) => {
      if (item === null) return acc;

      const [key, value] = item;
      if (value === null) {
        const { [key]: _, ...rest } = acc;
        return rest;
      } else {
        acc[key] = value;
        return acc;
      }
    },
    {} as Record<string, string>,
  ),
  map((store) => {
    /**
     * 获取指定单元格的内容
     *
     * @param rowIndex - 行的索引，从数字 0 开始
     * @param columnIndex - 列的索引，从数字 0 开始
     */
    return function getCellData(rowIndex: number, columnIndex: number) {
      const isHeaderRow = rowIndex === HEADER_ROW_INDEX;
      const isRowIndexCol = columnIndex === HEADER_COL_INDEX;

      if (isHeaderRow && isRowIndexCol) return '';
      if (isHeaderRow) return getColumnLabel(columnIndex - 1);
      if (isRowIndexCol) return rowIndex.toLocaleString();

      const key = getCellKey(rowIndex, columnIndex);
      const value = store[key];
      return typeof value !== 'undefined' ? value : key;
    };
  }),
  shareReplay({ bufferSize: 1, refCount: true }),
);

/**
 * 获取单元格左上角的坐标
 */
export const getCellPoint$ = combineLatest([getColumnLeft$, getRowTop$]).pipe(
  map(([getColumnLeft, getRowTop]) => {
    /**
     * 获取单元格左上角的坐标
     *
     * @param rowIndex - 行的索引，从数字 0 开始
     * @param columnIndex - 列的索引，从数字 0 开始
     */
    return function getCellPoint(rowIndex: number, columnIndex: number): IPoint {
      return {
        x: getColumnLeft(columnIndex),
        y: getRowTop(rowIndex),
      };
    };
  }),
  shareReplay({ refCount: true, bufferSize: 1 }),
);

/**
 * 获取单元格的盒子信息
 */
export const getCellRectBox$ = combineLatest([getColumnWidth$, getRowHeight$, scrollOffset$]).pipe(
  withLatestFrom(getColumnLeft$, getRowTop$),
  map(([[getColumnWidth, getRowHeight], getColumnLeft, getRowTop]) => {
    /**
     * 获取单元格的盒子信息
     *
     * @param rowIndex - 行的索引，从数字 0 开始
     * @param columnIndex - 列的索引，从数字 0 开始
     */
    return function getCellRectBox(rowIndex: number, columnIndex: number): IRectBox {
      return {
        x: getColumnLeft(columnIndex),
        y: getRowTop(rowIndex),
        width: getColumnWidth(columnIndex),
        height: getRowHeight(rowIndex),
      };
    };
  }),
  shareReplay({ refCount: true, bufferSize: 1 }),
);

/**
 * 根据屏幕坐标获取单元格位置索引
 */
export const getCellLocation$ = combineLatest([getColumnIndex$, getRowIndex$]).pipe(
  map(([getColumnIndex, getRowIndex]) => {
    /**
     * 根据屏幕坐标获取单元格位置索引
     *
     * - 两个参数的坐标，就是 `Event` 类型参数的 `clientX` 和 `clientY`
     *
     * @param clientX - 事件触发时鼠标相对于视口的 X 坐标
     * @param clientY - 事件触发时鼠标相对于视口的 Y 坐标
     */
    return function getCellLocation(clientX: number, clientY: number): ILocation {
      const rect = container.getBoundingClientRect();
      return {
        row: getRowIndex(clientX - rect.left),
        col: getColumnIndex(clientY - rect.top),
      };
    };
  }),
  shareReplay({ refCount: true, bufferSize: 1 }),
);
