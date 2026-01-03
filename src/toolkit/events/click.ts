import type { ISelectionStore, IStageClickListener, IStageMouseEvent } from './types';

import { filter, map, merge, switchMap } from 'rxjs';

import { EventListener } from './listener';
import { EMousedownTypes } from './types';

/**
 * Stage click listener
 */
export class StageClickListener extends EventListener implements IStageClickListener {
  store: ISelectionStore;
  events: IStageMouseEvent;

  /**
   * Constructor
   * @param store selection store
   * @param events stage mouse events
   */
  constructor(store: ISelectionStore, events: IStageMouseEvent) {
    super();

    this.store = store;
    this.events = events;
  }

  protected build() {
    const wholeColumnOrRowSelection$ = this.events.typedMouseDownLeft$.pipe(
      filter((e) => e.mousedownType === EMousedownTypes.HeaderClick),
      map((e) => {
        if (e.data.isMultiSelect) {
          this.store.addOrRemove(e.data);
        } else {
          this.store.override([e.data]);
        }
      }),
    );

    const cellSelection$ = this.events.typedMouseDownLeft$.pipe(
      filter((e) => e.mousedownType === EMousedownTypes.CellClick),
      map((e) => {
        this.store.override([e.data]);
      }),
    );

    return this.dispositionSubject.pipe(switchMap(() => merge(wholeColumnOrRowSelection$, cellSelection$)));
  }
}
