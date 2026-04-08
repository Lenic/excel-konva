import type { IListener } from './types';
import type { Observable } from 'rxjs';

import { BehaviorSubject, EMPTY, switchMap } from 'rxjs';

import { ObservableDisposable } from '../utils';

/**
 * Abstract base class for listeners, providing lifecycle management
 * and reactive status tracking.
 *
 * It extends ObservableDisposable to handle subscription cleanups automatically.
 */
export abstract class BaseListener<T = any> extends ObservableDisposable implements IListener {
  /**
   * Internal subject tracking whether the listener is active and processing events.
   * Emits true when listening starts and false when it stops.
   */
  protected activeSubject: BehaviorSubject<boolean>;

  /**
   * The result of the build method, which is an observable that emits values when the listener is active.
   */
  protected buildResult: Observable<T>;

  /**
   * Initializes a new instance of the BaseListener and sets up the active subject.
   */
  constructor() {
    super();

    this.activeSubject = new BehaviorSubject(false);
    this.disposeWithMe(() => {
      this.activeSubject.complete();
    });

    this.buildResult = this.activeSubject.pipe(
      switchMap((active) => (active ? this.activate() : this.deactivate())),
      this.withShare(),
    );
    this.disposeWithMe(this.buildResult.subscribe());
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

  /**
   * Provides the reactive flow for the listener.
   */
  protected abstract activate(): Observable<T>;

  /**
   * Provides a teardown reactive flow that runs when the listener is deactivated.
   *
   * @returns An observable that emits final values or performs cleanup tasks.
   */
  protected deactivate(): Observable<T> {
    return EMPTY;
  }
}
