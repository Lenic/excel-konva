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
