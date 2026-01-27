import type { IRectPool } from './types';
import type { Observable } from 'rxjs';

import Konva from 'konva';
import { map, of } from 'rxjs';

import { ObservableDisposable, Queue } from '../core';

/**
 * Rectangle pool
 */
export class RectPool extends ObservableDisposable implements IRectPool {
  private layer: Konva.Layer;
  private rects: Queue<Konva.Rect>;
  private lines: Queue<Konva.Line>;

  rectAttrs$: Observable<Partial<Konva.RectConfig>>;

  getRect$: Observable<() => Konva.Rect>;
  getLine$: Observable<() => Konva.Line>;

  /**
   * Create a new rectangle pool
   * @param layer - Konva layer
   * @param rectAttrs$ - Observable of rectangle attributes
   */
  constructor(layer: Konva.Layer, rectAttrs$: Observable<Partial<Konva.RectConfig>>) {
    super();

    this.layer = layer;

    this.rects = new Queue<Konva.Rect>();
    this.disposeWithMe(() => {
      while (this.rects.length > 0) {
        this.rects.dequeue()!.destroy();
      }
    });

    this.lines = new Queue<Konva.Line>();
    this.disposeWithMe(() => {
      while (this.lines.length > 0) {
        this.lines.dequeue()!.destroy();
      }
    });

    this.rectAttrs$ = rectAttrs$.pipe(this.withPublish());
    this.disposeWithMe(this.rectAttrs$.subscribe());

    this.getRect$ = this.buildGetShape$(this.rectAttrs$, this.rects, (attrs) => new Konva.Rect(attrs));
    this.disposeWithMe(this.getRect$.subscribe());

    this.getLine$ = this.buildGetShape$(of({}), this.lines, (attrs) => new Konva.Line(attrs));
    this.disposeWithMe(this.getLine$.subscribe());
  }

  disposeLine(line: Konva.Line): void {
    this.disposeShape(line, this.lines);
  }

  disposeRect(rect: Konva.Rect): void {
    this.disposeShape(rect, this.rects);
  }

  protected disposeShape<TShape extends Konva.Shape>(shape: TShape, queue: Queue<TShape>) {
    if (this.isDisposed) {
      shape.destroy();
      return;
    }

    shape.visible(false);
    if (shape.parent !== this.layer) shape.moveTo(this.layer);

    queue.enqueue(shape);
  }

  protected buildGetShape$<TConfig extends Konva.ShapeConfig, TShape extends Konva.Shape>(
    attrs$: Observable<Partial<TConfig>>,
    queue: Queue<TShape>,
    creator: (config: Partial<TConfig>) => TShape,
  ) {
    return attrs$.pipe(
      map((attrs) => {
        /**
         * Get shape from pool
         * @returns Shape
         */
        const getShape = (): TShape => {
          this.checkDisposed();

          if (queue.length > 0) {
            const shape = queue.dequeue()!;
            shape.setAttrs({
              ...attrs,
              visible: true,
            });
            return shape;
          }

          const newShape = creator(attrs);
          this.layer.add(newShape);

          return newShape;
        };

        return getShape;
      }),
      this.withPublish(),
    );
  }
}
