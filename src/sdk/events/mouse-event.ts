import type { IKonvaItems } from '../reference';
import type { IStageMouseEvent, TMousedownEvent } from './types';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

import { fromEventPattern, map } from 'rxjs';

import { ObservableDisposable } from '../utils/disposable';

/**
 * Stage mouse event implementation
 */
export class StageMouseEvent extends ObservableDisposable implements IStageMouseEvent {
  mousedown$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  mouseMove$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  mouseUp$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  dblclick$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  typedMouseDownLeft$: Observable<TMousedownEvent>;

  constructor(konvaItems: IKonvaItems) {
    super();

    const stage = konvaItems.stage;

    this.mousedown$ = this.getMouseEvent$(stage, 'mousedown');
    this.mouseMove$ = this.getMouseEvent$(stage, 'mousemove');
    this.mouseUp$ = this.getMouseEvent$(stage, 'mouseup');
    this.dblclick$ = this.getMouseEvent$(stage, 'dblclick');

    // Basic implementation of typedMouseDownLeft$
    this.typedMouseDownLeft$ = this.mousedown$.pipe(
      map((event) => {
        return {
          mousedownType: 'empty' as const,
          event,
        };
      }),
      this.withShare(),
    );
  }

  private getMouseEvent$(stage: Konva.Stage, key: keyof GlobalEventHandlersEventMap) {
    return fromEventPattern<Konva.KonvaEventObject<MouseEvent>>(
      (fn) => stage.on(key, fn),
      (fn) => stage.off(key, fn),
    ).pipe(this.withShare());
  }
}
