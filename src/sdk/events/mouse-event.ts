import type { IKonvaItems } from '../core';
import type { IStageMouseEvent } from './types';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

import { fromEventPattern } from 'rxjs';

import { ObservableDisposable } from '../utils/disposable';

/**
 * Stage mouse event implementation
 */
export class StageMouseEvent extends ObservableDisposable implements IStageMouseEvent {
  mousedown$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  mouseMove$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  mouseUp$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  dblclick$: Observable<Konva.KonvaEventObject<MouseEvent>>;

  constructor(konvaItems: IKonvaItems) {
    super();

    const stage = konvaItems.stage;

    this.mousedown$ = this.getMouseEvent$(stage, 'mousedown');
    this.mouseMove$ = this.getMouseEvent$(stage, 'mousemove');
    this.mouseUp$ = this.getMouseEvent$(stage, 'mouseup');
    this.dblclick$ = this.getMouseEvent$(stage, 'dblclick');
  }

  private getMouseEvent$(stage: Konva.Stage, key: keyof GlobalEventHandlersEventMap) {
    return fromEventPattern<Konva.KonvaEventObject<MouseEvent>>(
      (fn) => stage.on(key, fn),
      (fn) => stage.off(key, fn),
    ).pipe(this.withShare());
  }
}
