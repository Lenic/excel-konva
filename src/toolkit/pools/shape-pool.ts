import type { IShapePool } from './types';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

import { map } from 'rxjs';

import { ObservableDisposable, Queue } from '../core';

export class ShapePool<TConfig extends Konva.ShapeConfig, TShape extends Konva.Shape>
  extends ObservableDisposable
  implements IShapePool<TConfig, TShape>
{
  private layer: Konva.Layer;
  private shapes: Queue<TShape>;

  config$: Observable<Partial<TConfig>>;
  get$: Observable<() => TShape>;

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
        this.shapes.dequeue()!.destroy();
      }
    });

    this.config$ = config$.pipe(this.withPublish());
    this.disposeWithMe(this.config$.subscribe());

    this.get$ = this.build(this.config$, creator);
    this.disposeWithMe(this.get$.subscribe());
  }

  reuse(shape: TShape): void {
    if (this.isDisposed) {
      shape.destroy();
      return;
    }

    shape.visible(false);
    if (shape.parent !== this.layer) shape.moveTo(this.layer);

    this.shapes.enqueue(shape);
  }

  private build(attrs$: Observable<Partial<TConfig>>, creator: (config: Partial<TConfig>) => TShape) {
    return attrs$.pipe(
      map((globalAttrs) => {
        /**
         * Get shape from the pool
         *
         * @param attrs - The shape attributes.
         * @returns The shape.
         */
        const getShape = (attrs?: Partial<TConfig>): TShape => {
          this.checkDisposed();

          if (this.shapes.length > 0) {
            const shape = this.shapes.dequeue()!;
            shape.setAttrs({
              ...globalAttrs,
              ...attrs,
              visible: true,
            });
            return shape;
          }

          const newShape = creator({ ...globalAttrs, ...attrs });
          this.layer.add(newShape);

          return newShape;
        };

        return getShape;
      }),
      this.withPublish(),
    );
  }
}
