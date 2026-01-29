import type { IDisposable, TIdentifier } from '../../container';
import type { IRegionInfo } from '../types';
import type { Observable } from 'rxjs';

/**
 * Render listener interface
 */
export interface IRenderListener<T> extends IDisposable {
  /**
   * Rendering data
   */
  data: T | null;
  /**
   * Observable of rendering data
   */
  data$: Observable<T>;

  /**
   * Start listening to rendering events
   *
   * @returns A function to stop listening to events
   */
  start(): () => void;
}

/**
 * Selection listener interface identifier
 */
export const ISelectionListener: TIdentifier<IRenderListener<number>> = Symbol('ISelectionListener');
/**
 * Cell listener interface identifier
 */
export const ICellListener: TIdentifier<IRenderListener<IRegionInfo>> = Symbol('ICellListener');

/**
 * Range type
 *
 * - begin: start index
 * - end: end index
 */
export type TRange = [begin: number, end: number];

/**
 * Range collection interface
 */
export interface IRangeCollection {
  /**
   * The merged and ordered ranges
   */
  values: TRange[];

  /**
   * Add a range
   *
   * @param key - range key
   * @param range - range to add
   */
  push(key: string, range: TRange): void;

  /**
   * Remove a range
   *
   * @param key - range key to remove
   */
  remove(key: string): void;

  /**
   * Clear all ranges
   */
  clear(): void;

  /**
   * Merge ranges
   */
  merge(): void;
}
/**
 * Range collection interface identifier
 */
export const IRangeCollection: TIdentifier<IRangeCollection> = Symbol('IRangeCollection');
