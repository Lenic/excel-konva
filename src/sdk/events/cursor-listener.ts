import type { ILocation, IOffset, IPoint, IScrollOffset } from '../core';
import type { IAccumulatedDimensionManager, IAccumulatedFindOptions } from '../data';
import type { IFrozenInformation, IInformationManager } from '../ui';
import type { ICursorListener, IStageMouseEvent, TMouseMoveChangePatch } from './types';
import type Konva from 'konva';

import {
  animationFrameScheduler,
  auditTime,
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

import { getDefaultValue, isEqualLocation, isEqualPoint } from '../utils';

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
    this.disposeWithMe(() => void (this.rowFindOptions = createNewFindOptions()));
    this.column = column;
    this.disposeWithMe(() => void (this.columnFindOptions = createNewFindOptions()));

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

    const canProcess$ = combineLatest([this.activeSubject, isScrolling$]).pipe(
      map(([active, scrolling]) => active && !scrolling),
      distinctUntilChanged(),
    );

    return canProcess$.pipe(
      switchMap((can) =>
        !can
          ? of(null)
          : merge(
              fromEvent(stage.container(), 'mouseleave').pipe(map(() => null)),
              events.mouseMove$.pipe(map(() => true)),
            ).pipe(
              auditTime(16, animationFrameScheduler),
              map((v) => (!v ? null : stage.getPointerPosition())),
              startWith(null),
            ),
      ),
      distinctUntilChanged(isEqualPoint),
      map((v) => (!v ? null : ({ x: Math.round(v.x), y: Math.round(v.y) } as IPoint))),
      combineLatestWith(
        scrollOffset.change$.pipe(
          map(() => scrollOffset.offset),
          startWith(scrollOffset.offset),
        ),
        this.frozenInformation.value$,
      ),
      concatMap(
        ([position, offset, frozenInformation]) =>
          new Observable<TMouseMoveChangePatch>((observer) => {
            if (!isEqualPoint(position, this.position)) {
              const previousPosition = this.position;
              this.position = position;
              observer.next({ type: 'point', previous: previousPosition, current: position });
            }

            const nextLocation = this.getLocation(position, offset, frozenInformation);
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

  private getLocation(point: IPoint | null, offset: IOffset, frozenInformation: IFrozenInformation): ILocation | null {
    if (point === null) return null;

    const offsetX = point.x > frozenInformation.width ? offset.deltaX : 0;
    const offsetY = point.y > frozenInformation.height ? offset.deltaY : 0;

    const rowIndex = this.row.findIndex(point.y + offsetY, this.rowFindOptions);
    const columnIndex = this.column.findIndex(point.x + offsetX, this.columnFindOptions);
    return { rowIndex, columnIndex };
  }
}

function createNewFindOptions(): IAccumulatedFindOptions {
  return { cache: { index: -1, offset: -1 } };
}
