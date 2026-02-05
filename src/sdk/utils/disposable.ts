import type { MonoTypeOperatorFunction, Observable } from 'rxjs';

import { share, shareReplay, Subject, takeUntil } from 'rxjs';

import { Disposable } from '../../container';

/**
 * Observable disposable class
 */
export class ObservableDisposable extends Disposable {
  /**
   * Notification subject
   */
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
   * Observable disposable with destroy
   *
   * @returns The operator function
   */
  protected withDestroy<T>(): MonoTypeOperatorFunction<T> {
    return (source$: Observable<T>) => source$.pipe(takeUntil(this.notificationSubject));
  }

  /**
   * Observable disposable with publish
   *
   * @returns The operator function
   */
  protected withPublish<T>(): MonoTypeOperatorFunction<T> {
    return (source$: Observable<T>) =>
      source$.pipe(takeUntil(this.notificationSubject), shareReplay({ refCount: true, bufferSize: 1 }));
  }

  /**
   * Observable disposable with share
   *
   * @returns The operator function
   */
  protected withShare<T>(): MonoTypeOperatorFunction<T> {
    return (source$: Observable<T>) => source$.pipe(takeUntil(this.notificationSubject), share());
  }
}
