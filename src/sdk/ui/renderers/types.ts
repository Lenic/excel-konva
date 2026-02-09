import type { IDisposable, TIdentifier } from '../../../container';
import type { Observable } from 'rxjs';

/**
 * Common interface for all render listeners
 */
export interface IRenderListener<T> extends IDisposable {
  /**
   * Current data state of the renderer
   */
  data: T | null;

  /**
   * Observable that emits data state changes
   */
  data$: Observable<T>;

  /**
   * Starts the rendering listener
   *
   * @returns A function that can be used to stop the rendering listener
   */
  start(): () => void;
}

/**
 * Identifier for ICellRenderer in the DI container
 */
export const ICellRenderer: TIdentifier<IRenderListener<void>> = Symbol('ICellRenderer');

/**
 * Identifier for ISelectionRenderer in the DI container
 */
export const ISelectionRenderer: TIdentifier<IRenderListener<number>> = Symbol('ISelectionRenderer');
