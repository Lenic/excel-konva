import type { ILocation, ISheetConfig } from '../core';
import type { ISelectionStore } from './selection-store';
import type { ICursorListener, IStageMouseEvent } from './types';

import { filter, finalize, map, merge, switchMap, takeUntil, takeWhile, tap } from 'rxjs';

import { BaseListener } from '../core';

export class StageDragListener extends BaseListener {
  private config: ISheetConfig;
  private events: IStageMouseEvent;
  private selectionStore: ISelectionStore;
  private cursorListener: ICursorListener;

  constructor(
    config: ISheetConfig,
    events: IStageMouseEvent,
    cursorListener: ICursorListener,
    selectionStore: ISelectionStore,
  ) {
    super();

    this.config = config;
    this.events = events;
    this.cursorListener = cursorListener;
    this.selectionStore = selectionStore;
  }

  protected activate() {
    const drag$ = this.events.pointerdown$.pipe(
      filter((e) => e.evt.button === 0),
      map((e) => [this.cursorListener.location, e.evt.ctrlKey || e.evt.metaKey] as const),
      filter((v): v is [ILocation, boolean] => v[0] !== null && v[0].rowIndex > 0 && v[0].columnIndex > 0),
      switchMap(([location, isMultipleSelect]) => {
        const selectionUpdater = this.selectionStore.create(location, isMultipleSelect);

        return this.cursorListener.change$.pipe(
          filter((v) => v.type === 'location'),
          map((v) => v.current),
          takeUntil(this.events.pointerup$),
          takeWhile((v) => v !== null),
          map((nextLocation) => selectionUpdater.update(nextLocation)),
          finalize(() => selectionUpdater.complete()),
        );
      }),
    );

    const click$ = this.events.click$.pipe(
      filter((e) => e.evt.button === 0),
      map((e) => [this.cursorListener.location, e.evt.ctrlKey || e.evt.metaKey] as const),
      filter((v): v is [ILocation, boolean] => v[0] !== null && (v[0].rowIndex === 0 || v[0].columnIndex === 0)),
      tap(([location, isMultipleSelect]) => {
        if (location.rowIndex === 0 && location.columnIndex === 0) return;

        const updater = this.selectionStore.create(
          location.rowIndex === 0 ? { ...location, rowIndex: 1 } : { ...location, columnIndex: 1 },
          isMultipleSelect,
        );
        updater.update(
          location.rowIndex === 0
            ? { ...location, rowIndex: this.config.options.rowCount - 1 }
            : { ...location, columnIndex: this.config.options.columnCount - 1 },
        );
        updater.complete();
      }),
    );

    return merge(drag$, click$);
  }
}
