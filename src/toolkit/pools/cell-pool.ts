import type { ICellPool } from './types';

import Konva from 'konva';

import { RectPool } from './rect-pool';

/**
 * Cell pool
 */
export class CellPool extends RectPool implements ICellPool {
  private texts: Konva.Text[];
  private nextTextIndex: number;
  private textAttrs: Partial<Konva.TextConfig>;

  /**
   * Create a new cell pool
   * @param layer - Konva layer
   * @param rectAttrs - Rectangle attributes
   * @param textAttrs - Text attributes
   */
  constructor(layer: Konva.Layer, rectAttrs: Partial<Konva.RectConfig>, textAttrs: Partial<Konva.TextConfig>) {
    super(layer, rectAttrs);

    this.texts = [];
    this.nextTextIndex = 0;

    this.textAttrs = textAttrs;

    this.disposeWithMe(() => {
      this.texts.forEach((text) => text.destroy());
      this.texts = [];
      this.nextTextIndex = 0;
      this.textAttrs = {};
    });
  }

  getText(): Konva.Text {
    this.checkDisposed();

    if (this.nextTextIndex < this.texts.length) {
      const text = this.texts[this.nextTextIndex++];
      text.setAttrs({
        ...this.textAttrs,
        visible: true,
      });
      return text;
    }

    const newText = new Konva.Text({
      ...this.textAttrs,
      listening: false,
    });
    this.texts.push(newText);
    this.nextTextIndex++;

    return newText;
  }

  reset(): void {
    this.checkDisposed();

    super.reset();

    this.texts.forEach((text) => text.visible(false));
    this.nextTextIndex = 0;
  }
}
