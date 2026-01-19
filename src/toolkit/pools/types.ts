import type { TIdentifier } from '../../container';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

/**
 * Rectangle pool interface
 */
export interface IRectPool {
  /**
   * Rectangle attributes
   */
  rectAttrs: Partial<Konva.RectConfig>;
  /**
   * Rectangle attributes Observable
   */
  rectAttrs$: Observable<Partial<Konva.RectConfig>>;
  /**
   * Get rectangle Observable
   *
   * The emitted function signature is: `() => Konva.Rect`
   * - Returns: The rectangle factory function.
   */
  getRect$: Observable<() => Konva.Rect>;
  /**
   * Reset rectangle pool
   */
  reset(): void;
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
export interface ICellPool extends IRectPool {
  /**
   * Text attributes
   */
  textAttrs: Partial<Konva.TextConfig>;
  /**
   * Text attributes Observable
   */
  textAttrs$: Observable<Partial<Konva.TextConfig>>;
  /**
   * Get text Observable
   *
   * The emitted function signature is: `() => Konva.Text`
   * - Returns: The text factory function.
   */
  getText$: Observable<() => Konva.Text>;
}
/**
 * Cell pool interface identifier
 */
export const ICellPool: TIdentifier<ICellPool> = Symbol('ICellPool');
