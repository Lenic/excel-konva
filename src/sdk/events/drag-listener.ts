import type { ILocation } from '../core';
import type { ISelectionStore } from './selection-store';
import type { ICursorListener, IStageMouseEvent } from './types';

import { filter, finalize, map, switchMap, takeUntil, takeWhile } from 'rxjs';

import { BaseListener } from '../core';

export class StageDragListener extends BaseListener {
  private events: IStageMouseEvent;
  private selectionStore: ISelectionStore;
  private cursorListener: ICursorListener;

  constructor(events: IStageMouseEvent, cursorListener: ICursorListener, selectionStore: ISelectionStore) {
    super();

    this.events = events;
    this.cursorListener = cursorListener;
    this.selectionStore = selectionStore;
  }

  protected activate() {
    return this.events.pointerdown$.pipe(
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
  }
}
