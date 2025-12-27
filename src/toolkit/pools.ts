import Konva from 'konva';

import { SELECTION_FILL_COLOR, SELECTION_STROKE_COLOR } from './constants';
import { selectionLayer } from './konva-items';

export const cellPool = {
  rects: [] as Konva.Rect[],
  texts: [] as Konva.Text[],
  nextRectIndex: 0,
  nextTextIndex: 0,
  getRect(): Konva.Rect {
    if (this.nextRectIndex < this.rects.length) {
      const rect = this.rects[this.nextRectIndex++];
      rect.visible(true);
      return rect;
    }
    const newRect = new Konva.Rect({
      fill: '#ffffff',
      stroke: '#e8e8e8',
      strokeWidth: 0.5,
    });
    this.rects.push(newRect);
    this.nextRectIndex++;
    return newRect;
  },
  getText(): Konva.Text {
    if (this.nextTextIndex < this.texts.length) {
      const text = this.texts[this.nextTextIndex++];
      text.visible(true);
      return text;
    }
    const newText = new Konva.Text({
      fontSize: 12,
      fontFamily: 'Inter, Arial, sans-serif',
      fill: '#333333',
      verticalAlign: 'middle',
      padding: 8,
      listening: false,
      align: 'left',
      ellipsis: true,
      wrap: 'none',
    });
    this.texts.push(newText);
    this.nextTextIndex++;
    return newText;
  },
  reset(): void {
    this.rects.forEach((rect) => rect.visible(false));
    this.texts.forEach((text) => text.visible(false));
    this.nextRectIndex = 0;
    this.nextTextIndex = 0;
  },
};

export const selectionPool = {
  rects: [] as Konva.Rect[],
  nextRectIndex: 0,
  getRect: function () {
    if (this.nextRectIndex < this.rects.length) {
      const rect = this.rects[this.nextRectIndex++];
      rect.visible(true);
      return rect;
    }
    const newRect = new Konva.Rect({
      fill: SELECTION_FILL_COLOR,
      stroke: SELECTION_STROKE_COLOR,
      strokeWidth: 2,
      listening: false,
    });
    selectionLayer.add(newRect);
    this.rects.push(newRect);
    this.nextRectIndex++;
    return newRect;
  },
  reset: function () {
    this.rects.forEach((rect) => rect.visible(false));
    this.nextRectIndex = 0;
  },
};

export const activeCellMarkerPool = {
  rects: [] as Konva.Rect[],
  nextRectIndex: 0,
  getRect: function () {
    if (this.nextRectIndex < this.rects.length) {
      const rect = this.rects[this.nextRectIndex++];
      rect.visible(true);
      return rect;
    }
    // 活动单元格标记使用绿色边框
    const newRect = new Konva.Rect({
      stroke: '#10B981',
      strokeWidth: 3,
      fill: 'rgba(255, 255, 255, 0.7)',
      listening: false,
    });
    selectionLayer.add(newRect);
    this.rects.push(newRect);
    this.nextRectIndex++;
    return newRect;
  },
  reset: function () {
    this.rects.forEach((rect) => rect.visible(false));
    this.nextRectIndex = 0;
  },
};
