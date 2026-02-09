import type { IEventListener, ISelectionStore, IStageMouseEvent } from './types';

import { ObservableDisposable } from '../utils';

/**
 * Listener for stage drag events to handle rectangular selection
 */
export class StageDragListener extends ObservableDisposable implements IEventListener {
  private _selectionStore: ISelectionStore;
  private stageMouseEvent: IStageMouseEvent;

  /**
   * Initializes a new instance of the StageDragListener class.
   *
   * @param selectionStore - The store for managing selections
   * @param stageMouseEvent - The service providing mouse event observables
   */
  constructor(selectionStore: ISelectionStore, stageMouseEvent: IStageMouseEvent) {
    super();
    this._selectionStore = selectionStore;
    this.stageMouseEvent = stageMouseEvent;
  }

  /**
   * Starts listening to drag-related events
   */
  startListening(): () => void {
    // Simplified drag implementation for now
    const sub = this.stageMouseEvent.mousedown$.subscribe(() => {
      console.log('Drag started, selections:', this._selectionStore.list.length);
    });

    this.disposeWithMe(sub);
    return () => {
      sub.unsubscribe();
    };
  }
}
