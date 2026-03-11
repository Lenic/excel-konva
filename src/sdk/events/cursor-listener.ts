import type { ILocation, IOffset, IPoint, IScrollOffset } from '../core';
import type { IAccumulatedDimensionManager, IAccumulatedFindOptions } from '../data';
import type { ICursorListener, IStageMouseEvent, TMouseMoveChangePatch } from './types';
import type Konva from 'konva';

import {
  animationFrameScheduler,
  auditTime,
  BehaviorSubject,
  combineLatest,
  combineLatestWith,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  fromEvent,
  map,
  merge,
  Observable,
  of,
  startWith,
  switchMap,
} from 'rxjs';

import { getDefaultValue, isEqualLocation, isEqualPoint, ObservableDisposable } from '../utils';

export class CursorListener extends ObservableDisposable implements ICursorListener {
  private notifySubject: BehaviorSubject<boolean>;
  private row: IAccumulatedDimensionManager;
  private column: IAccumulatedDimensionManager;
  private rowFindOptions: IAccumulatedFindOptions;
  private columnFindOptions: IAccumulatedFindOptions;

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

    this.rowFindOptions = createNewFindOptions();
    this.disposeWithMe(() => void (this.rowFindOptions = getDefaultValue<IAccumulatedFindOptions>()));
    this.columnFindOptions = createNewFindOptions();
    this.disposeWithMe(() => void (this.columnFindOptions = getDefaultValue<IAccumulatedFindOptions>()));

    this.row = row;
    this.disposeWithMe(() => void (this.rowFindOptions = createNewFindOptions()));
    this.column = column;
    this.disposeWithMe(() => void (this.columnFindOptions = createNewFindOptions()));

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

    return canProcess$.pipe(
      switchMap((can) =>
        !can
          ? of(null)
          : merge(
              fromEvent(stage.container(), 'mouseleave').pipe(map(() => null)),
              events.mouseMove$.pipe(map((e) => `${e.evt.clientX},${e.evt.clientY}`)),
            ).pipe(
              auditTime(16, animationFrameScheduler),
              map((v) => (!v ? null : stage.getPointerPosition())),
              startWith(stage.getPointerPosition()),
            ),
      ),
      distinctUntilChanged(isEqualPoint),
      combineLatestWith(
        scrollOffset.change$.pipe(
          map(() => scrollOffset.offset),
          startWith(scrollOffset.offset),
        ),
      ),
      concatMap(
        ([position, offset]) =>
          new Observable<TMouseMoveChangePatch>((observer) => {
            if (!isEqualPoint(position, this.position)) {
              const previousPosition = this.position;
              this.position = position;
              observer.next({ type: 'point', previous: previousPosition, current: position });
            }

            const nextLocation = this.getLocation(position, offset);
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

  private getLocation(point: IPoint | null, offset: IOffset): ILocation | null {
    if (point === null) return null;

    const rowIndex = this.row.findIndex(point.y + offset.deltaY, this.rowFindOptions);
    const columnIndex = this.column.findIndex(point.x + offset.deltaX, this.columnFindOptions);
    return { rowIndex, columnIndex };
  }
}

function createNewFindOptions(): IAccumulatedFindOptions {
  return { cache: { index: -1, offset: -1 } };
}
