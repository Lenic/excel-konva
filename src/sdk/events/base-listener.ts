import type { IEventListener } from './types';

import { BehaviorSubject } from 'rxjs';

import { ObservableDisposable } from '../utils';

/**
 * Abstract base class for event listeners, providing lifecycle management
 * and reactive status tracking.
 *
 * It extends ObservableDisposable to handle subscription cleanups automatically.
 */
export abstract class BaseListener extends ObservableDisposable implements IEventListener {
  /**
   * Internal subject tracking whether the listener is active and processing events.
   * Emits true when listening starts and false when it stops.
   */
  protected activeSubject: BehaviorSubject<boolean>;

  /**
   * Initializes a new instance of the BaseListener and sets up the active subject.
   */
  constructor() {
    super();

    this.activeSubject = new BehaviorSubject<boolean>(false);
    this.disposeWithMe(() => {
      this.activeSubject.complete();
    });
  }

  /**
   * Activates the listener and returns a function to deactivate it.
   *
   * @returns A teardown function that, when called, sets the active status to false.
   */
  startListening(): () => void {
    this.activeSubject.next(true);

    return () => {
      this.activeSubject.next(false);
    };
  }
}
