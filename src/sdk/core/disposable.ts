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
   * Observable disposable with destroy
   */
  protected withDestroy<T>(): MonoTypeOperatorFunction<T> {
    return (source$: Observable<T>) => source$.pipe(takeUntil(this.notificationSubject));
  }

  /**
   * Observable disposable with publish
   */
  protected withPublish<T>(): MonoTypeOperatorFunction<T> {
    return (source$: Observable<T>) =>
      source$.pipe(takeUntil(this.notificationSubject), shareReplay({ refCount: true, bufferSize: 1 }));
  }

  /**
   * Observable disposable with share
   */
  protected withShare<T>(): MonoTypeOperatorFunction<T> {
    return (source$: Observable<T>) => source$.pipe(takeUntil(this.notificationSubject), share());
  }
}
