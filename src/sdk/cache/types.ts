import type { IDisposable, TIdentifier } from '../../container';
import type { IDimensionChangePatch } from '../data';
import type { ICellRange } from '../types';
import type { IRectBox } from '../ui';
import type { Observable } from 'rxjs';

/**
 * Accumulated dimension of items
 */
export interface IAccumulatedDimensionManager {
  /**
   * An observable that emits when a dimension value changes.
   */
  readonly change$: Observable<IDimensionChangePatch>;

  /**
   * Get accumulated dimension
   *
   * - The accumulated dimension of the first item is 0
   *
   * @param index - Item index
   * @returns Accumulated dimension
   */
  get(index: number): number;
  /**
   * Find index by accumulated dimension
   *
   * @param offset - Accumulated dimension
   * @returns Item index
   */
  findIndex(offset: number): number;
}
export const IAccumulatedDimensionManager: TIdentifier<IAccumulatedDimensionManager> =
  Symbol('IAccumulatedDimensionManager');

export interface ILayoutCache extends IDisposable {
  getCellRect(rowIndex: number, columnIndex: number): IRectBox;
  getRangeRects(range: ICellRange): IRectBox[];
  invalidateRange(range: ICellRange): void;
  invalidateByRow(rowIndex: number): void;
  invalidateByColumn(columnIndex: number): void;
}
