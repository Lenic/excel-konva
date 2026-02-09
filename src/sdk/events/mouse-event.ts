import type { IKonvaItems } from '../reference';
import type { IStageMouseEvent, TMousedownEvent } from './types';
import type Konva from 'konva';

import { fromEvent, map, type Observable, share } from 'rxjs';

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

    this.mousedown$ = fromEvent<Konva.KonvaEventObject<MouseEvent>>(stage, 'mousedown').pipe(share());
    this.mouseMove$ = fromEvent<Konva.KonvaEventObject<MouseEvent>>(stage, 'mousemove').pipe(share());
    this.mouseUp$ = fromEvent<Konva.KonvaEventObject<MouseEvent>>(stage, 'mouseup').pipe(share());
    this.dblclick$ = fromEvent<Konva.KonvaEventObject<MouseEvent>>(stage, 'dblclick').pipe(share());

    // Basic implementation of typedMouseDownLeft$
    this.typedMouseDownLeft$ = this.mousedown$.pipe(
      map((event) => {
        return {
          mousedownType: 'empty' as const,
          event,
        };
      }),
      share(),
    );
  }
}
