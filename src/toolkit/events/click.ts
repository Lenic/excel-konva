import type { ISelectionStore, IStageClickListener, IStageMouseEvent } from './types';
import type { Subscription } from 'rxjs';

import { filter, map, merge, switchMap } from 'rxjs';

import { Disposable } from '../core';

import { EMousedownTypes } from './types';

/**
 * Stage click listener
 */
export class StageClickListener extends Disposable implements IStageClickListener {
  private subscription: Subscription | null;
  store: ISelectionStore;
  events: IStageMouseEvent;

  /**
   * Constructor
   * @param store selection store
   * @param events stage mouse events
   */
  constructor(store: ISelectionStore, events: IStageMouseEvent) {
    super();

    this.subscription = null;

    this.store = store;
    this.events = events;
  }

  startListening(): () => void {
    if (this.subscription) return this.destroySubscription;

    this.subscription = this.build().subscribe();
    return this.destroySubscription;
  }

  private destroySubscription = () => {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  };

  private build() {
    const wholeColumnOrRowSelection$ = this.events.typedMouseDownLeft$.pipe(
      filter((e) => e.mousedownType === EMousedownTypes.HeaderClick),
      map((e) => {
        if (e.data.isMultiSelect) {
          this.store.add(e.data);
        } else {
          this.store.replace(e.data);
        }
      }),
    );

    const cellSelection$ = this.events.typedMouseDownLeft$.pipe(
      filter((e) => e.mousedownType === EMousedownTypes.CellClick),
      map((e) => {
        this.store.replace(e.data);
      }),
    );

    return this.dispositionSubject.pipe(switchMap(() => merge(wholeColumnOrRowSelection$, cellSelection$)));
  }
}
