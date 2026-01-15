import type { ICellDimension, IScrollOffset } from '../helpers';
import type { Observable } from 'rxjs';

import { combineLatest, debounceTime, distinctUntilChanged, EMPTY, map, merge, of, skip, switchMap, take } from 'rxjs';

import { rootElement } from '../core-elements';
import { stage } from '../konva-items';

import { RESIZE_TOLERANCE } from './constants';
import { EventListener } from './listener';
import { EBoundaryTypes, ECursorTypes, type ICursorListener, type IStageMouseEvent, type TCursorEvent } from './types';

export class CursorListener extends EventListener implements ICursorListener {
  events: IStageMouseEvent;
  cell: ICellDimension;
  scrollOffset: IScrollOffset;

  constructor(events: IStageMouseEvent, cell: ICellDimension, scrollOffset: IScrollOffset) {
    super();

    this.events = events;
    this.cell = cell;
    this.scrollOffset = scrollOffset;
  }

  protected build(): Observable<void> {
    return merge(
      this.events.mouseDownLeft$.pipe(map(() => true)),
      this.events.mouseUpLeft$.pipe(map(() => false)),
      // Stop processing while scrolling
      merge(
        this.scrollOffset.offset$.pipe(
          skip(1),
          map(() => true),
        ),
        this.scrollOffset.offset$.pipe(
          debounceTime(100),
          map(() => false),
        ),
      ),
    ).pipe(
      distinctUntilChanged(),
      switchMap((isDown) => {
        if (isDown) return EMPTY;

        const bounding = rootElement.getBoundingClientRect();
        return combineLatest([
          this.events.mouseMove$,
          this.cell.getCellLocation$.pipe(
            switchMap((v1) =>
              this.cell.getCellRectBox$.pipe(
                take(1),
                map((v2) => [v1, v2] as const),
              ),
            ),
          ),
        ]).pipe(
          switchMap(([e, [getCellLocation, getCellRectBox]]): Observable<TCursorEvent> => {
            const relX = e.evt.clientX - bounding.left;
            const relY = e.evt.clientY - bounding.top;

            const location = getCellLocation(relX, relY);
            if (location.rowIndex === 0) {
              const rect = getCellRectBox(location.rowIndex, location.columnIndex);
              const leftLeftX = rect.x - RESIZE_TOLERANCE;
              const leftRightX = rect.x + RESIZE_TOLERANCE;
              const rightLeftX = leftLeftX + rect.width;
              const rightRightX = leftRightX + rect.width;
              if ((leftLeftX <= relX && relX <= leftRightX) || (rightLeftX <= relX && relX <= rightRightX)) {
                return of({ type: ECursorTypes.ResizeBoundary, direction: EBoundaryTypes.Column });
              }
            } else if (location.columnIndex === 0) {
              const rect = getCellRectBox(location.rowIndex, location.columnIndex);
              const topTopY = rect.y - RESIZE_TOLERANCE;
              const topBottomY = rect.y + RESIZE_TOLERANCE;
              const bottomTopY = topTopY + rect.height;
              const bottomBottomY = topBottomY + rect.height;
              if ((topTopY <= relY && relY <= topBottomY) || (bottomTopY <= relY && relY <= bottomBottomY)) {
                return of({ type: ECursorTypes.ResizeBoundary, direction: EBoundaryTypes.Row });
              }
            }

            return of({ type: ECursorTypes.Empty });
          }),
        );
      }),
      distinctUntilChanged((a, b) => {
        const ak = Object.keys(a);
        const bk = Object.keys(b);
        if (ak.length !== bk.length) return false;
        for (let i = 0; i < ak.length; i++) {
          if (ak[i] !== bk[i]) return false;
        }
        return true;
      }),
      map((e) => {
        const styles = stage.container().style;
        switch (e.type) {
          case ECursorTypes.Empty:
            styles.cursor = 'default';
            break;
          case ECursorTypes.ResizeBoundary:
            styles.cursor = e.direction === EBoundaryTypes.Column ? 'col-resize' : 'row-resize';
            break;
        }

        return;
      }),
    );
  }
}
