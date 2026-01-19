import type { ICellPool } from './types';
import type { Observable } from 'rxjs';

import Konva from 'konva';
import { map, shareReplay } from 'rxjs';

import { RectPool } from './rect-pool';

/**
 * Cell pool
 */
export class CellPool extends RectPool implements ICellPool {
  private texts: Konva.Text[];
  private nextTextIndex: number;

  textAttrs: Partial<Konva.TextConfig>;

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

    this.texts = [];
    this.nextTextIndex = 0;

    this.textAttrs = {};
    this.disposeWithMe(() => void (this.textAttrs = {}));

    this.textAttrs$ = textAttrs$.pipe(shareReplay({ bufferSize: 1, refCount: true }));
    this.disposeWithMe(this.textAttrs$.subscribe((textAttrs) => void (this.textAttrs = textAttrs)));

    this.getText$ = this.buildGetText$();
    this.disposeWithMe(this.getText$.subscribe());

    this.disposeWithMe(() => {
      this.texts.forEach((text) => text.destroy());
      this.texts = [];
      this.nextTextIndex = 0;
    });
  }

  reset(): void {
    this.checkDisposed();

    super.reset();

    this.texts.forEach((text) => text.visible(false));
    this.nextTextIndex = 0;
  }

  private buildGetText$() {
    return this.textAttrs$.pipe(
      map((textAttrs) => {
        const getText = () => {
          if (this.nextTextIndex < this.texts.length) {
            const text = this.texts[this.nextTextIndex++];
            text.setAttrs({
              ...textAttrs,
              visible: true,
            });
            return text;
          }

          const newText = new Konva.Text({
            ...textAttrs,
            listening: false,
          });
          this.layer.add(newText);
          this.texts.push(newText);
          this.nextTextIndex++;

          return newText;
        };

        return getText;
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}
