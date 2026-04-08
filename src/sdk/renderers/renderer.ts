import type { IRenderListener } from './types';
import type { Observable, Subscription } from 'rxjs';

import { ReplaySubject } from 'rxjs';

import { ObservableDisposable } from '../utils';

export abstract class RenderListener<T> extends ObservableDisposable implements IRenderListener<T> {
  private subscription: Subscription | null;
  private subject: ReplaySubject<T>;

  value: T | null;

  value$: Observable<T>;

  constructor() {
    super();

    this.subscription = null;
    this.subject = new ReplaySubject<T>();
    this.disposeWithMe(() => {
      this.subject.complete();
    });

    this.value = null;
    this.disposeWithMe(() => void (this.value = null));

    this.value$ = this.subject.asObservable();
    this.disposeWithMe(this.value$.subscribe((data) => void (this.value = data)));

    this.disposeWithMe(this.destroySubscription);
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

  protected abstract build(): Observable<T>;
}
