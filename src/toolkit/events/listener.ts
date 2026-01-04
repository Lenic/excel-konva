import type { IEventListener } from './types';
import type { Observable, Subscription } from 'rxjs';

import { ObservableDisposable } from '../core';

/**
 * Event listener
 */
export abstract class EventListener extends ObservableDisposable implements IEventListener {
  private subscription: Subscription | null;

  /**
   * Constructor
   */
  constructor() {
    super();

    this.subscription = null;
  }

  startListening(): () => void {
    if (this.subscription) return this.destroySubscription;

    this.subscription = this.build().subscribe();
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
  protected abstract build(): Observable<void>;
}
