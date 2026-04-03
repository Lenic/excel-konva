import type { ILocation } from '../core';
import type { ISelectionStore } from './selection-store';
import type { ICursorListener, IEventListener, IStageMouseEvent } from './types';

import { filter, finalize, map, switchMap, takeUntil, takeWhile } from 'rxjs';

import { BaseListener } from './base-listener';

export class StageDragListener extends BaseListener implements IEventListener {
  private events: IStageMouseEvent;
  private selectionStore: ISelectionStore;
  private cursorListener: ICursorListener;

  constructor(events: IStageMouseEvent, cursorListener: ICursorListener, selectionStore: ISelectionStore) {
    super();

    this.events = events;
    this.cursorListener = cursorListener;
    this.selectionStore = selectionStore;

    this.disposeWithMe(this.build().subscribe());
  }

  private build() {
    return this.events.mousedown$.pipe(
      filter((e) => e.evt.button === 0),
      map((e) => [this.cursorListener.location, e.evt.ctrlKey || e.evt.metaKey] as const),
      filter((v): v is [ILocation, boolean] => v[0] != null),
      switchMap(([location, isMultipleSelect]) => {
        const selectionUpdater = this.selectionStore.create(location, isMultipleSelect);

        return this.cursorListener.change$.pipe(
          filter((v) => v.type === 'location'),
          map((v) => v.current),
          takeUntil(this.events.mouseUp$),
          takeWhile((v) => v != null),
          map((nextLocation) => selectionUpdater.update(nextLocation)),
          finalize(() => selectionUpdater.complete()),
        );
      }),
    );
  }
}
