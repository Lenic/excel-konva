import type { IShapePool } from './types';
import type Konva from 'konva';

import { map, type Observable } from 'rxjs';

import { ObservableDisposable, Queue } from '../utils';

/**
 * Implementation of shape pool for reusing Konva shapes
 */
export class ShapePool<TConfig extends Konva.ShapeConfig = Konva.ShapeConfig, TShape extends Konva.Shape = Konva.Shape>
  extends ObservableDisposable
  implements IShapePool<TConfig, TShape>
{
  private layer: Konva.Layer;
  private shapes: Queue<TShape>;

  /**
   * Global attributes for all shapes in the pool
   */
  config$: Observable<Partial<TConfig>>;

  /**
   * Observable producing the shape getter function
   */
  get$: Observable<(attrs?: Partial<TConfig>) => TShape>;

  /**
   * Initializes a new instance of the ShapePool class.
   *
   * @param layer - The Konva layer where shapes will be added
   * @param config$ - Observable of global attributes for the shapes
   * @param creator - Function to create a new shape instance
   */
  constructor(
    layer: Konva.Layer,
    config$: Observable<Partial<TConfig>>,
    creator: (config: Partial<TConfig>) => TShape,
  ) {
    super();

    this.layer = layer;
    this.shapes = new Queue<TShape>();

    this.disposeWithMe(() => {
      while (this.shapes.length > 0) {
        this.shapes.dequeue()?.destroy();
      }
    });

    this.config$ = config$.pipe(this.withPublish());
    this.disposeWithMe(this.config$.subscribe());

    this.get$ = this.build(this.config$, creator);
    this.disposeWithMe(this.get$.subscribe());
  }

  /**
   * Returns a shape to the pool
   *
   * @param shape - The shape to reuse
   */
  reuse(shape: TShape): void {
    if (this.isDisposed) {
      shape.destroy();
      return;
    }

    shape.visible(false);
    if (shape.parent !== this.layer) {
      shape.moveTo(this.layer);
    }

    this.shapes.enqueue(shape);
  }

  /**
   * Builds the getter function observable
   */
  private build(attrs$: Observable<Partial<TConfig>>, creator: (config: Partial<TConfig>) => TShape) {
    return attrs$.pipe(
      map((globalAttrs) => {
        return (attrs?: Partial<TConfig>): TShape => {
          this.checkDisposed();

          if (this.shapes.length > 0) {
            const shape = this.shapes.dequeue()!;
            shape.setAttrs({
              ...globalAttrs,
              ...attrs,
              visible: true,
              listening: false,
            });
            return shape;
          }

          const newShape = creator({ ...globalAttrs, ...attrs });
          this.layer.add(newShape);
          return newShape;
        };
      }),
      this.withPublish(),
    );
  }
}
