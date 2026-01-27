import type { IDisposable, TIdentifier } from '../../container';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

/**
 * Shape pool interface
 */
export interface IShapePool<TConfig extends Konva.ShapeConfig, TShape extends Konva.Shape> extends IDisposable {
  /**
   * Shape config Observable
   */
  config$: Observable<Partial<TConfig>>;
  /**
   * Get shape Observable
   *
   * The emitted function signature is: `(attrs?: Partial<TConfig>) => TShape`
   * - `attrs`: The shape attributes.
   * - Returns: The shape factory function.
   */
  get$: Observable<(attrs?: Partial<TConfig>) => TShape>;
  /**
   * Reuse the shape
   */
  reuse(shape: TShape): void;
}
/**
 * Selection pool interface identifier
 */
export const ISelectionPool: TIdentifier<IShapePool<Konva.RectConfig, Konva.Rect>> = Symbol('ISelectionPool');
/**
 * Active cell marker pool interface identifier
 */
export const IActiveCellMarkerPool: TIdentifier<IShapePool<Konva.RectConfig, Konva.Rect>> =
  Symbol('IActiveCellMarkerPool');
/**
 * Selection line pool interface identifier
 */
export const ISelectionLinePool: TIdentifier<IShapePool<Konva.LineConfig, Konva.Line>> = Symbol('ISelectionLinePool');

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
  /**
   * Get line Observable
   *
   * The emitted function signature is: `() => Konva.Line`
   * - Returns: The line factory function.
   */
  getLine$: Observable<() => Konva.Line>;
  /**
   * Dispose line shape
   */
  disposeLine(line: Konva.Line): void;
}

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
