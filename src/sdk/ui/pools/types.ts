import type { IDisposable, TIdentifier } from '../../../container';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

/**
 * Shape pool interface for managing and reusing Konva shapes
 */
export interface IShapePool<
  TConfig extends Konva.ShapeConfig = Konva.ShapeConfig,
  TShape extends Konva.Shape = Konva.Shape,
> extends IDisposable {
  /**
   * Observable that emits the global configuration for shapes in the pool
   */
  readonly config$: Observable<Partial<TConfig>>;

  /**
   * Observable producing a function to retrieve (and optionally configure) a shape from the pool
   */
  readonly get$: Observable<(attrs?: Partial<TConfig>) => TShape>;

  /**
   * Returns a shape to the pool for later reuse
   *
   * @param shape - The Konva shape to return to the pool
   */
  reuse(shape: TShape): void;
}

/**
 * Identifier for generic shape pools in the DI container
 */
export const IRectPool: TIdentifier<IShapePool<Konva.RectConfig, Konva.Rect>> = Symbol('IRectPool');

/**
 * Identifier for ICellTextPool in the DI container
 */
export const ICellTextPool: TIdentifier<IShapePool<Konva.TextConfig, Konva.Text>> = Symbol('ICellTextPool');
