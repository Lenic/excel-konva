import type { ILocation, IPoint, IScrollOffset } from '../core';
import type { IAccumulatedDimensionManager } from '../data';
import type { ICursorListener, IStageMouseEvent, TMouseMoveChangePatch } from './types';
import type Konva from 'konva';

import {
  animationFrameScheduler,
  auditTime,
  BehaviorSubject,
  combineLatest,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  fromEvent,
  map,
  merge,
  Observable,
  startWith,
  switchMap,
} from 'rxjs';

import { isEqualLocation, isEqualPoint, ObservableDisposable } from '../utils';

export class CursorListener extends ObservableDisposable implements ICursorListener {
  private notifySubject: BehaviorSubject<boolean>;
  private row: IAccumulatedDimensionManager;
  private column: IAccumulatedDimensionManager;

  position: IPoint | null;
  location: ILocation | null;
  change$: Observable<TMouseMoveChangePatch>;

  constructor(
    stage: Konva.Stage,
    row: IAccumulatedDimensionManager,
    column: IAccumulatedDimensionManager,
    events: IStageMouseEvent,
    scrollOffset: IScrollOffset,
  ) {
    super();

    this.notifySubject = new BehaviorSubject<boolean>(false);
    this.disposeWithMe(() => {
      this.notifySubject.complete();
    });

    this.row = row;
    this.column = column;

    this.position = stage.getPointerPosition();
    this.disposeWithMe(() => void (this.position = null));
    this.location = this.getLocation(this.position);
    this.disposeWithMe(() => void (this.location = null));

    this.change$ = this.buildChangePatch(events, scrollOffset, stage);
    this.disposeWithMe(this.change$.subscribe());
  }

  startListening(): () => void {
    this.notifySubject.next(true);

    return () => {
      this.notifySubject.next(false);
    };
  }

  private buildChangePatch(events: IStageMouseEvent, scrollOffset: IScrollOffset, stage: Konva.Stage) {
    // Stop processing while scrolling
    const isScrolling$ = merge(
      scrollOffset.change$.pipe(map(() => true)),
      scrollOffset.change$.pipe(
        debounceTime(100),
        map(() => false),
      ),
    ).pipe(startWith(false), distinctUntilChanged());

    // Stop processing while mouse is pressed
    const isPressed$ = merge(events.mousedown$.pipe(map(() => true)), events.mouseUp$.pipe(map(() => false))).pipe(
      startWith(false),
      distinctUntilChanged(),
    );

    const canProcess$ = combineLatest([this.notifySubject, isScrolling$, isPressed$]).pipe(
      map(([active, scrolling, pressed]) => active && !scrolling && !pressed),
      distinctUntilChanged(),
    );

    const mouseMove$ = merge(
      fromEvent(stage.container(), 'mouseleave').pipe(map(() => null)),
      events.mouseMove$.pipe(map((e) => `${e.evt.clientX},${e.evt.clientY}`)),
    ).pipe(
      auditTime(16, animationFrameScheduler),
      map((v) => (!v ? null : stage.getPointerPosition())),
      distinctUntilChanged(isEqualPoint),
    );

    return canProcess$.pipe(
      switchMap((can) => (can ? mouseMove$ : EMPTY)),
      concatMap(
        (position) =>
          new Observable<TMouseMoveChangePatch>((observer) => {
            console.log('position', Date.now(), position);
            if (!position) {
              debugger;
            }
            if (!isEqualPoint(position, this.position)) {
              const previousPosition = this.position;
              this.position = position;
              observer.next({ type: 'point', previous: previousPosition, current: position });
            }

            const nextLocation = this.getLocation(position);
            if (!isEqualLocation(this.location, nextLocation)) {
              const previousLocation = this.location;
              this.location = nextLocation;
              observer.next({ type: 'location', previous: previousLocation, current: this.location });
            }

            observer.complete();
          }),
      ),
      this.withShare(),
    );
  }

  getLocation(point: IPoint | null): ILocation | null {
    if (point === null) return null;

    const rowIndex = this.row.findIndex(point.y);
    const columnIndex = this.column.findIndex(point.x);
    return { rowIndex, columnIndex };
  }
}
