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
export const ISelectionListener: TIdentifier<IRenderListener<number>> = Symbol('SelectionListener');
/**
 * Cell listener interface identifier
 */
export const ICellListener: TIdentifier<IRenderListener<IRegionInfo>> = Symbol('CellListener');
