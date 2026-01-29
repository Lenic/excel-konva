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
 * Shape pool interface identifier
 */
export const IShapePool: TIdentifier<IShapePool<Konva.RectConfig, Konva.Rect>> = Symbol('IShapePool');

/**
 * Line pool interface identifier
 */
export const ILinePool: TIdentifier<IShapePool<Konva.LineConfig, Konva.Line>> = Symbol('ILinePool');

/**
 * Cell text pool interface identifier
 */
export const ICellTextPool: TIdentifier<IShapePool<Konva.TextConfig, Konva.Text>> = Symbol('ICellTextPool');
