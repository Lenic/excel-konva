import type { ICellPool } from './types';
import type { Observable } from 'rxjs';

import Konva from 'konva';
import { map, shareReplay } from 'rxjs';

import { ObservableDisposable, Queue } from '../core';

/**
 * Cell pool
 */
export class CellPool extends ObservableDisposable implements ICellPool {
  private layer: Konva.Layer;
  private rects: Queue<Konva.Rect>;
  private texts: Queue<Konva.Text>;

  rectAttrs$: Observable<Partial<Konva.RectConfig>>;
  textAttrs$: Observable<Partial<Konva.TextConfig>>;

  getRect$: Observable<() => Konva.Rect>;
  getText$: Observable<() => Konva.Text>;

  /**
   * Create a new cell pool
   * @param layer - Konva layer
   * @param rectAttrs$ - Observable of rectangle attributes
   * @param textAttrs$ - Observable of text attributes
   */
  constructor(
    layer: Konva.Layer,
    rectAttrs$: Observable<Partial<Konva.RectConfig>>,
    textAttrs$: Observable<Partial<Konva.TextConfig>>,
  ) {
    super();

    this.layer = layer;
    this.rects = new Queue<Konva.Rect>();
    this.texts = new Queue<Konva.Text>();

    this.rectAttrs$ = rectAttrs$.pipe(shareReplay({ bufferSize: 1, refCount: true }));
    this.disposeWithMe(this.rectAttrs$.subscribe());

    this.textAttrs$ = textAttrs$.pipe(shareReplay({ bufferSize: 1, refCount: true }));
    this.disposeWithMe(this.textAttrs$.subscribe());

    this.getRect$ = this.buildGetShape$(this.rectAttrs$, this.rects, (attrs) => new Konva.Rect(attrs));
    this.disposeWithMe(this.getRect$.subscribe());

    this.getText$ = this.buildGetShape$(this.textAttrs$, this.texts, (attrs) => new Konva.Text(attrs));
    this.disposeWithMe(this.getText$.subscribe());

    this.disposeWithMe(() => {
      while (this.rects.length > 0) {
        this.rects.dequeue()!.destroy();
      }
      while (this.texts.length > 0) {
        this.texts.dequeue()!.destroy();
      }
    });
  }

  disposeRect(rect: Konva.Rect): void {
    this.disposeShape(rect, this.rects);
  }

  disposeText(text: Konva.Text): void {
    this.disposeShape(text, this.texts);
  }

  private disposeShape<TShape extends Konva.Shape>(shape: TShape, queue: Queue<TShape>) {
    this.checkDisposed();

    shape.visible(false);
    if (shape.parent !== this.layer) shape.moveTo(this.layer);

    queue.enqueue(shape);
  }

  private buildGetShape$<TConfig extends Konva.ShapeConfig, TShape extends Konva.Shape>(
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
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}
