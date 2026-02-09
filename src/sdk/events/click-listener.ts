import type { IEventListener, ISelectionStore, IStageMouseEvent } from './types';

import { ObservableDisposable } from '../utils';

/**
 * Listener for stage click events to handle selection updates
 */
export class StageClickListener extends ObservableDisposable implements IEventListener {
  private selectionStore: ISelectionStore;
  private stageMouseEvent: IStageMouseEvent;

  /**
   * Initializes a new instance of the StageClickListener class.
   *
   * @param selectionStore - The store for managing selections
   * @param stageMouseEvent - The service providing mouse event observables
   */
  constructor(selectionStore: ISelectionStore, stageMouseEvent: IStageMouseEvent) {
    super();
    this.selectionStore = selectionStore;
    this.stageMouseEvent = stageMouseEvent;
  }

  /**
   * Starts listening to click-related events
   */
  startListening(): () => void {
    const sub = this.stageMouseEvent.typedMouseDownLeft$.subscribe((event) => {
      if (event.mousedownType === 'cell-click') {
        const { data } = event;
        if (data.isMultiSelect) {
          this.selectionStore.toggle(data);
        } else {
          this.selectionStore.override([data]);
        }
      } else if (event.mousedownType === 'empty') {
        this.selectionStore.clear();
      }
    });

    this.disposeWithMe(sub);
    return () => {
      sub.unsubscribe();
    };
  }
}
