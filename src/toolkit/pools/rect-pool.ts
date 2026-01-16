import type { IRectPool } from './types';

import Konva from 'konva';

import { Disposable } from '../../container';

/**
 * Rectangle pool
 */
export class RectPool extends Disposable implements IRectPool {
  private layer: Konva.Layer;
  private rectAttrs: Partial<Konva.RectConfig>;
  private rects: Konva.Rect[] = [];
  private nextRectIndex = 0;

  /**
   * Create a new rectangle pool
   * @param layer - Konva layer
   * @param rectAttrs - Rectangle attributes
   */
  constructor(layer: Konva.Layer, rectAttrs: Partial<Konva.RectConfig>) {
    super();

    this.layer = layer;
    this.rectAttrs = rectAttrs;

    this.disposeWithMe(() => {
      this.layer.destroy();
      this.layer = null as unknown as Konva.Layer;
      this.rects.forEach((rect) => rect.destroy());
      this.rects = [];
      this.nextRectIndex = 0;
      this.rectAttrs = {};
    });
  }

  getRect(): Konva.Rect {
    this.checkDisposed();

    if (this.nextRectIndex < this.rects.length) {
      const rect = this.rects[this.nextRectIndex++];
      rect.setAttrs({
        ...this.rectAttrs,
        visible: true,
      });
      return rect;
    }

    const newRect = new Konva.Rect({
      ...this.rectAttrs,
      listening: false,
    });
    this.layer.add(newRect);
    this.rects.push(newRect);
    this.nextRectIndex++;

    return newRect;
  }

  reset() {
    this.checkDisposed();

    this.rects.forEach((rect) => rect.visible(false));
    this.nextRectIndex = 0;
  }
}
