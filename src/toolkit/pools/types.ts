import type { IDisposable, TIdentifier } from '../../container';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

/**
 * Rectangle pool interface
 */
export interface IRectPool extends IDisposable {
  /**
   * Get rectangle Observable
   *
   * The emitted function signature is: `() => Konva.Rect`
   * - Returns: The rectangle factory function.
   */
  getRect$: Observable<() => Konva.Rect>;
  /**
   * Dispose rectangle shape
   */
  disposeRect(rect: Konva.Rect): void;
}
/**
 * Selection pool interface identifier
 */
export const ISelectionPool: TIdentifier<IRectPool> = Symbol('ISelectionPool');
/**
 * Active cell marker pool interface identifier
 */
export const IActiveCellMarkerPool: TIdentifier<IRectPool> = Symbol('IActiveCellMarkerPool');

/**
 * Cell pool interface
 */
export interface ICellPool extends IRectPool, IDisposable {
  /**
   * Get text Observable
   *
   * The emitted function signature is: `() => Konva.Text`
   * - Returns: The text factory function.
   */
  getText$: Observable<() => Konva.Text>;
  /**
   * Dispose text shape
   */
  disposeText(text: Konva.Text): void;
}
/**
 * Cell pool interface identifier
 */
export const ICellPool: TIdentifier<ICellPool> = Symbol('ICellPool');
