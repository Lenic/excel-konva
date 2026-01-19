import type { IRectPool } from './types';
import type { Observable } from 'rxjs';

import Konva from 'konva';
import { map, shareReplay } from 'rxjs';

import { Disposable } from '../../container';

/**
 * Rectangle pool
 */
export class RectPool extends Disposable implements IRectPool {
  protected layer: Konva.Layer;
  private rects: Konva.Rect[] = [];
  private nextRectIndex = 0;

  rectAttrs: Partial<Konva.RectConfig>;

  rectAttrs$: Observable<Partial<Konva.RectConfig>>;

  getRect$: Observable<() => Konva.Rect>;

  /**
   * Create a new rectangle pool
   * @param layer - Konva layer
   * @param rectAttrs$ - Observable of rectangle attributes
   */
  constructor(layer: Konva.Layer, rectAttrs$: Observable<Partial<Konva.RectConfig>>) {
    super();

    this.layer = layer;

    this.rectAttrs = {};
    this.disposeWithMe(() => void (this.rectAttrs = {}));

    this.rectAttrs$ = rectAttrs$.pipe(shareReplay({ bufferSize: 1, refCount: true }));
    this.disposeWithMe(this.rectAttrs$.subscribe((rectAttrs) => void (this.rectAttrs = rectAttrs)));

    this.getRect$ = this.buildGetRect$();
    this.disposeWithMe(this.getRect$.subscribe());

    this.disposeWithMe(() => {
      this.layer.destroy();
      this.layer = null as unknown as Konva.Layer;
      this.rects.forEach((rect) => rect.destroy());
      this.rects = [];
      this.nextRectIndex = 0;
    });
  }

  reset() {
    this.checkDisposed();

    this.rects.forEach((rect) => rect.visible(false));
    this.nextRectIndex = 0;
  }

  private buildGetRect$() {
    return this.rectAttrs$.pipe(
      map((rectAttrs) => {
        /**
         * Get a rectangle from the pool
         * @returns A rectangle from the pool
         */
        const getRect = () => {
          if (this.nextRectIndex < this.rects.length) {
            const rect = this.rects[this.nextRectIndex++];
            rect.setAttrs({
              ...rectAttrs,
              visible: true,
            });
            return rect;
          }

          const newRect = new Konva.Rect({
            ...rectAttrs,
            listening: false,
          });
          this.layer.add(newRect);
          this.rects.push(newRect);
          this.nextRectIndex++;

          return newRect;
        };

        return getRect;
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}
