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
  pointerdown$: Observable<Konva.KonvaEventObject<PointerEvent>>;
  pointermove$: Observable<Konva.KonvaEventObject<PointerEvent>>;
  pointerup$: Observable<Konva.KonvaEventObject<PointerEvent>>;
  dblclick$: Observable<Konva.KonvaEventObject<PointerEvent>>;
  click$: Observable<Konva.KonvaEventObject<PointerEvent>>;

  constructor(konvaItems: IKonvaItems) {
    super();

    const stage = konvaItems.stage;

    this.pointerdown$ = this.getMouseEvent$(stage, 'pointerdown');
    this.pointermove$ = this.getMouseEvent$(stage, 'pointermove');
    this.pointerup$ = this.getMouseEvent$(stage, 'pointerup');
    this.dblclick$ = this.getMouseEvent$(stage, 'dblclick');
    this.click$ = this.getMouseEvent$(stage, 'click');
  }

  private getMouseEvent$(stage: Konva.Stage, key: keyof GlobalEventHandlersEventMap) {
    return fromEventPattern<Konva.KonvaEventObject<PointerEvent>>(
      (fn) => stage.on(key, fn),
      (fn) => stage.off(key, fn),
    ).pipe(this.withShare());
  }
}
