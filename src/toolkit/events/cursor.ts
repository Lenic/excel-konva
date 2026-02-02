import type { IScrollOffset } from '../helpers';
import type { IExcelEntrance, IOffset } from '../types';
import type { ICursorGetter, IStageMouseEvent } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, debounceTime, distinctUntilChanged, map, merge, skip } from 'rxjs';

import { ObservableDisposable } from '../core';

/**
 * Cursor getter
 */
export class CursorGetter extends ObservableDisposable implements ICursorGetter {
  offset: IOffset | null;
  offset$: Observable<IOffset | null>;

  /**
   * Constructor
   *
   * @param events - Events
   * @param scrollOffset - Scroll offset
   * @param excelEntrance - Excel entrance
   */
  constructor(events: IStageMouseEvent, scrollOffset: IScrollOffset, excelEntrance: IExcelEntrance) {
    super();

    this.offset = null;
    this.disposeWithMe(() => {
      this.offset = null;
    });

    this.offset$ = this.build(events, scrollOffset, excelEntrance);
    this.disposeWithMe(
      this.offset$.subscribe((offset) => {
        this.offset = offset;
      }),
    );
  }

  private build(events: IStageMouseEvent, offset: IScrollOffset, entrance: IExcelEntrance): Observable<IOffset | null> {
    return combineLatest([
      merge(
        events.mouseDownLeft$.pipe(map(() => true)),
        events.mouseUpLeft$.pipe(map(() => false)),
        // Stop processing while scrolling
        merge(
          offset.offset$.pipe(
            skip(1),
            map(() => true),
          ),
          offset.offset$.pipe(
            debounceTime(100),
            map(() => false),
          ),
        ),
      ),
      events.mouseMove$,
    ]).pipe(
      distinctUntilChanged(),
      map(([isDown]) => {
        if (isDown) return null;

        const position = entrance.stage.getPointerPosition();
        return !position ? null : ({ deltaX: position.x, deltaY: position.y } as IOffset);
      }),
      this.withPublish(),
    );
  }
}
