import type { IDisposable } from '../../container';
import type { ICellRange } from '../types';
import type { Observable } from 'rxjs';

export interface IItemDimensionChangePatch {
  index: number;
  previous: number;
  next: number;
}

export interface IItemDimension extends IDisposable {
  /**
   * 离散变化：用于最小 repaint
   */
  readonly change$: Observable<IItemDimensionChangePatch>;

  /**
   * 同步读取：用于 layout 计算
   */
  get(index: number): number;

  set(index: number, value: number): void;
  reset(index: number): void;
}

export interface IClearCellValuePatch {
  type: 'clear';
  range: ICellRange;
}

export interface ISetCellValuePatch<T = unknown> {
  type: 'set';
  values: T[][];
  range: ICellRange;
}

export type TCellPatch<T = unknown> = IClearCellValuePatch | ISetCellValuePatch<T>;

export interface IDataSource<T = unknown> extends IDisposable {
  /**
   * 离散变更流，用于最小 repaint
   */
  readonly patch$: Observable<TCellPatch<T>>;

  /**
   * 同步读取，用于 layout / hit-test
   */
  getCell(row: number, col: number): T | null;

  getRowCount(): number;
  getColCount(): number;
}
