import type { ILocation, IOffset, IPoint, IScrollOffset } from '../core';
import type { IAccumulatedDimensionManager, IAccumulatedFindOptions } from '../data';
import type { IFrozenInformation, IInformationManager } from '../ui';
import type { ICursorListener, IStageMouseEvent, TMouseMoveChangePatch } from './types';
import type Konva from 'konva';

import {
  animationFrameScheduler,
  auditTime,
  combineLatestWith,
  debounceTime,
  distinctUntilChanged,
  EMPTY,
  fromEvent,
  map,
  merge,
  mergeWith,
  Observable,
  startWith,
  switchMap,
  tap,
} from 'rxjs';

import { createNewFindOptions, getDefaultValue, isEqualLocation, isEqualPoint } from '../utils';

import { BaseListener } from './base-listener';

export class CursorListener extends BaseListener implements ICursorListener {
  private row: IAccumulatedDimensionManager;
  private column: IAccumulatedDimensionManager;
  private rowFindOptions: IAccumulatedFindOptions;
  private columnFindOptions: IAccumulatedFindOptions;
  private frozenInformation: IInformationManager<IFrozenInformation>;

  position: IPoint | null;
  location: ILocation | null;
  change$: Observable<TMouseMoveChangePatch>;

  constructor(
    stage: Konva.Stage,
    row: IAccumulatedDimensionManager,
    column: IAccumulatedDimensionManager,
    events: IStageMouseEvent,
    scrollOffset: IScrollOffset,
    frozenInformation: IInformationManager<IFrozenInformation>,
  ) {
    super();

    this.frozenInformation = frozenInformation;
    this.disposeWithMe(
      () => void (this.frozenInformation = getDefaultValue<IInformationManager<IFrozenInformation>>()),
    );

    this.rowFindOptions = createNewFindOptions();
    this.disposeWithMe(() => void (this.rowFindOptions = getDefaultValue<IAccumulatedFindOptions>()));
    this.columnFindOptions = createNewFindOptions();
    this.disposeWithMe(() => void (this.columnFindOptions = getDefaultValue<IAccumulatedFindOptions>()));

    this.row = row;
    this.column = column;

    this.position = null;
    this.disposeWithMe(() => void (this.position = null));
    this.location = null;
    this.disposeWithMe(() => void (this.location = null));

    this.change$ = this.buildChangePatch(events, scrollOffset, stage);
    this.disposeWithMe(this.change$.subscribe());
  }

  private buildChangePatch(events: IStageMouseEvent, scrollOffset: IScrollOffset, stage: Konva.Stage) {
    const isScrolling$ = merge(
      scrollOffset.change$.pipe(map(() => true)),
      scrollOffset.change$.pipe(
        debounceTime(100),
        map(() => false),
      ),
    ).pipe(startWith(false), distinctUntilChanged());

    return this.activeSubject.pipe(
      switchMap((active) => {
        if (!active) return EMPTY;

        return new Observable<TMouseMoveChangePatch>((observer) => {
          const position$ = events.mouseMove$.pipe(
            auditTime(16, animationFrameScheduler),
            map(() => stage.getPointerPosition()),
            mergeWith(fromEvent(stage.container(), 'mouseleave').pipe(map(() => null))),
            map((v): IPoint | null => (!v ? null : { x: Math.floor(v.x), y: Math.floor(v.y) })),
            distinctUntilChanged(isEqualPoint),
            map((position) => {
              if (!isEqualPoint(position, this.position)) {
                const previousPosition = this.position;
                this.position = position;

                observer.next({ type: 'point', previous: previousPosition, current: position });
              }
              return this.position;
            }),
          );

          const subscription = position$
            .pipe(
              combineLatestWith(isScrolling$),
              map(([position, scrolling]) => (scrolling ? null : position)),
              distinctUntilChanged(isEqualPoint),
              combineLatestWith(
                scrollOffset.change$.pipe(
                  map(() => scrollOffset.offset),
                  startWith(scrollOffset.offset),
                ),
                this.frozenInformation.value$,
              ),
              tap(([position, offset, frozenInformation]) => {
                const nextLocation = this.getLocation(position, offset, frozenInformation);
                if (!isEqualLocation(this.location, nextLocation)) {
                  const previousLocation = this.location;
                  this.location = nextLocation;
                  observer.next({ type: 'location', previous: previousLocation, current: this.location });
                }
              }),
            )
            .subscribe();

          return () => {
            subscription.unsubscribe();
          };
        });
      }),
      this.withShare(),
    );
  }

  private getLocation(point: IPoint | null, offset: IOffset, frozenInformation: IFrozenInformation): ILocation | null {
    if (point === null) return null;

    const offsetX = point.x > frozenInformation.width ? offset.deltaX : 0;
    const offsetY = point.y > frozenInformation.height ? offset.deltaY : 0;

    const rowIndex = this.row.findIndex(point.y + offsetY, this.rowFindOptions);
    const columnIndex = this.column.findIndex(point.x + offsetX, this.columnFindOptions);
    return { rowIndex, columnIndex };
  }
}
