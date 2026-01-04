import type { IRenderListener } from './types';
import type { Observable, Subscription } from 'rxjs';

import { ReplaySubject } from 'rxjs';

import { ObservableDisposable } from '../core';

/**
 * Event listener
 */
export abstract class RenderListener<T> extends ObservableDisposable implements IRenderListener<T> {
  private subscription: Subscription | null;
  private subject: ReplaySubject<T>;

  data: T | null;
  data$: Observable<T>;

  /**
   * Constructor
   */
  constructor() {
    super();

    this.subscription = null;
    this.subject = new ReplaySubject<T>();
    this.disposeWithMe(() => {
      this.subject.complete();
    });

    this.data = null;
    this.disposeWithMe(() => {
      this.data = null;
    });

    this.data$ = this.subject.asObservable();
    this.disposeWithMe(
      this.data$.subscribe((data) => {
        this.data = data;
      }),
    );
  }

  start(): () => void {
    if (this.subscription) return this.destroySubscription;

    this.subscription = this.build().subscribe((data) => {
      this.subject.next(data);
    });
    return this.destroySubscription;
  }

  private destroySubscription = () => {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  };

  /**
   * Build event listener
   */
  protected abstract build(): Observable<T>;
}
