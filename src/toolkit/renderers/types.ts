import type { TIdentifier } from '../../container';
import type { IRegionInfo } from '../types';
import type { Observable } from 'rxjs';

/**
 * Render listener interface
 */
export interface IRenderListener<T> {
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
  readonly values: TRange[];

  /**
   * Add a range
   *
   * @param range - range to add
   */
  push(range: TRange): void;
}
/**
 * Range collection interface identifier
 */
export const IRangeCollection: TIdentifier<IRangeCollection> = Symbol('IRangeCollection');
