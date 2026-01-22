import type { ICellPool } from './types';
import type { Observable } from 'rxjs';

import Konva from 'konva';

import { Queue } from '../core';

import { RectPool } from './rect-pool';

/**
 * Cell pool
 */
export class CellPool extends RectPool implements ICellPool {
  private texts: Queue<Konva.Text>;

  textAttrs$: Observable<Partial<Konva.TextConfig>>;

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
    super(layer, rectAttrs$);

    this.texts = new Queue<Konva.Text>();

    this.textAttrs$ = textAttrs$.pipe(this.withPublish());
    this.disposeWithMe(this.textAttrs$.subscribe());

    this.getText$ = this.buildGetShape$(this.textAttrs$, this.texts, (attrs) => new Konva.Text(attrs));
    this.disposeWithMe(this.getText$.subscribe());

    this.disposeWithMe(() => {
      while (this.texts.length > 0) {
        this.texts.dequeue()!.destroy();
      }
    });
  }

  disposeText(text: Konva.Text): void {
    this.disposeShape(text, this.texts);
  }
}
