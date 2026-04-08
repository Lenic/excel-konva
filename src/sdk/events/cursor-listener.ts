import type { ILocation, IObservableValue, IOffset, IPoint, IScrollOffset } from '../core';
import type { IAccumulatedDimensionManager, IAccumulatedFindOptions } from '../data';
import type { IFrozenInformation } from '../ui';
import type { ICursorListener, IStageMouseEvent, TMouseMoveChangePatch } from './types';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

import {
  animationFrameScheduler,
  auditTime,
  combineLatest,
  concatMap,
  debounceTime,
  distinctUntilChanged,
  from,
  fromEvent,
  map,
  merge,
  mergeWith,
  startWith,
} from 'rxjs';

import { BaseListener } from '../core';
import { createNewFindOptions, getDefaultValue, isEqualLocation, isEqualPoint } from '../utils';

export class CursorListener extends BaseListener<TMouseMoveChangePatch> implements ICursorListener {
  private stage: Konva.Stage;
  private events: IStageMouseEvent;
  private scrollOffset: IScrollOffset;
  private row: IAccumulatedDimensionManager;
  private column: IAccumulatedDimensionManager;
  private rowFindOptions: IAccumulatedFindOptions;
  private columnFindOptions: IAccumulatedFindOptions;
  private frozenInformation: IObservableValue<IFrozenInformation>;

  position: IPoint | null;
  location: ILocation | null;
  change$: Observable<TMouseMoveChangePatch>;

  constructor(
    stage: Konva.Stage,
    row: IAccumulatedDimensionManager,
    column: IAccumulatedDimensionManager,
    events: IStageMouseEvent,
    scrollOffset: IScrollOffset,
    frozenInformation: IObservableValue<IFrozenInformation>,
  ) {
    super();

    this.frozenInformation = frozenInformation;
    this.disposeWithMe(() => void (this.frozenInformation = getDefaultValue<IObservableValue<IFrozenInformation>>()));

    this.rowFindOptions = createNewFindOptions();
    this.disposeWithMe(() => void (this.rowFindOptions = getDefaultValue<IAccumulatedFindOptions>()));
    this.disposeWithMe(
      row.change$.subscribe((patch) => {
        if (patch.type === 'dimension' && patch.current > (this.rowFindOptions.cache?.index ?? 0)) return;
        this.rowFindOptions = createNewFindOptions();
      }),
    );

    this.columnFindOptions = createNewFindOptions();
    this.disposeWithMe(() => void (this.columnFindOptions = getDefaultValue<IAccumulatedFindOptions>()));
    this.disposeWithMe(
      column.change$.subscribe((patch) => {
        if (patch.type === 'dimension' && patch.current > (this.columnFindOptions.cache?.index ?? 0)) return;
        this.columnFindOptions = createNewFindOptions();
      }),
    );

    this.row = row;
    this.stage = stage;
    this.column = column;
    this.events = events;
    this.scrollOffset = scrollOffset;

    this.position = null;
    this.disposeWithMe(() => void (this.position = null));
    this.location = null;
    this.disposeWithMe(() => void (this.location = null));

    this.change$ = this.buildResult;
  }

  protected activate() {
    const isScrolling$ = merge(
      this.scrollOffset.change$.pipe(map(() => true)),
      this.scrollOffset.change$.pipe(
        debounceTime(100),
        map(() => false),
      ),
    ).pipe(startWith(false), distinctUntilChanged());

    const mousePosition$ = this.events.mouseMove$.pipe(
      auditTime(16, animationFrameScheduler),
      map(() => this.stage.getPointerPosition()),
      mergeWith(fromEvent(this.stage.container(), 'mouseleave').pipe(map(() => null))),
      map((v): IPoint | null => (!v ? null : { x: Math.floor(v.x), y: Math.floor(v.y) })),
      distinctUntilChanged(isEqualPoint),
    );

    const scrollOffset$ = this.scrollOffset.change$.pipe(
      map(() => this.scrollOffset.offset),
      startWith(this.scrollOffset.offset),
    );

    return combineLatest([mousePosition$, isScrolling$, scrollOffset$, this.frozenInformation.value$]).pipe(
      concatMap(([position, scrolling, offset, frozenInformation]) => {
        const patches: TMouseMoveChangePatch[] = [];

        // Update the current cursor position if a change is detected
        if (!isEqualPoint(this.position, position)) {
          const previousPosition = this.position;
          this.position = position;
          patches.push({ type: 'point', previous: previousPosition, current: this.position });
        }

        // Calculate the logical grid location based on the current position and scrolling state.
        // Note: During active scrolling, the location is forced to null for consistency.
        const effectivePosition = scrolling ? null : this.position;
        const nextLocation = this.getLocation(effectivePosition, offset, frozenInformation);

        if (!isEqualLocation(this.location, nextLocation)) {
          const previousLocation = this.location;
          this.location = nextLocation;
          patches.push({ type: 'location', previous: previousLocation, current: this.location });
        }

        // Sequence the patches as discrete notifications to the external listeners
        return from(patches);
      }),
    );
  }

  protected deactivate(): Observable<TMouseMoveChangePatch> {
    const patches: TMouseMoveChangePatch[] = [];
    const previousPosition = this.position;
    const previousLocation = this.location;

    this.position = null;
    this.location = null;

    if (!isEqualPoint(previousPosition, this.position)) {
      patches.push({ type: 'point', previous: previousPosition, current: this.position });
    }

    if (!isEqualLocation(previousLocation, this.location)) {
      patches.push({ type: 'location', previous: previousLocation, current: this.location });
    }

    return from(patches);
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
