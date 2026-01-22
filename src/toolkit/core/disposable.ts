import type { MonoTypeOperatorFunction, Observable } from 'rxjs';

import { share, shareReplay, Subject, takeUntil } from 'rxjs';

import { Disposable } from '../../container';

/**
 * Observable disposable class
 */
export class ObservableDisposable extends Disposable {
  private notificationSubject: Subject<void>;

  /**
   * Observable disposable constructor
   */
  constructor() {
    super();

    this.notificationSubject = new Subject<void>();
    this.disposeWithMe(() => {
      this.notificationSubject.next();
      this.notificationSubject.complete();
    });
  }

  /**
   * Observable disposable with publish
   * @returns MonoTypeOperatorFunction<T>
   */
  protected withPublish<T>(): MonoTypeOperatorFunction<T> {
    return (source$: Observable<T>) =>
      source$.pipe(takeUntil(this.notificationSubject), shareReplay({ refCount: true, bufferSize: 1 }));
  }

  /**
   * Observable disposable with share
   * @returns MonoTypeOperatorFunction<T>
   */
  protected withShare<T>(): MonoTypeOperatorFunction<T> {
    return (source$: Observable<T>) => source$.pipe(takeUntil(this.notificationSubject), share());
  }
}
