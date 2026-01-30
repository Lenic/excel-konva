import type { Observable, Subscription } from 'rxjs';

import { ObservableDisposable } from '../core';

export class CollectionSubscription extends ObservableDisposable {
  private subscriptions: Map<string, Subscription>;

  constructor() {
    super();

    this.subscriptions = new Map<string, Subscription>();

    this.disposeWithMe(() => {
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      this.subscriptions.clear();
    });
  }

  update(items: readonly [key: string, getter: () => Observable<any>][]) {
    this.checkDisposed();

    const currentKeys = new Set<string>();

    // 1. Add new subscriptions
    for (const [key, getter] of items) {
      currentKeys.add(key);

      // New → create subscription
      if (!this.subscriptions.has(key)) {
        this.subscriptions.set(key, getter().subscribe());
      }
    }

    // 2. Remove old subscriptions
    Array.from(this.subscriptions.entries()).forEach(([key, item]) => {
      if (!currentKeys.has(key)) {
        item.unsubscribe();
        this.subscriptions.delete(key);
      }
    });

    return this;
  }
}
