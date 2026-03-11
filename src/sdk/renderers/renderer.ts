import type { IRenderListener } from './types';
import type { Observable, Subscription } from 'rxjs';

import { ReplaySubject } from 'rxjs';

import { ObservableDisposable } from '../utils';

/**
 * Abstract base class for all renderers
 */
export abstract class RenderListener<T> extends ObservableDisposable implements IRenderListener<T> {
  private subscription: Subscription | null;
  private subject: ReplaySubject<T>;

  /**
   * Current data state
   */
  value: T | null;

  /**
   * Observable for data state changes
   */
  value$: Observable<T>;

  /**
   * Initializes a new instance of the RenderListener class.
   */
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

  /**
   * Starts subscribing to the data source and emitting changes
   *
   * @returns A cleanup function to stop the subscription
   */
  start(): () => void {
    if (this.subscription) return this.destroySubscription;

    this.subscription = this.build().subscribe((data) => {
      this.subject.next(data);
    });
    return this.destroySubscription;
  }

  /**
   * Destroys the current data source subscription
   */
  private destroySubscription = () => {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  };

  /**
   * Abstract method to build the data source observable
   *
   * @returns An observable of the renderer's data state
   */
  protected abstract build(): Observable<T>;
}
