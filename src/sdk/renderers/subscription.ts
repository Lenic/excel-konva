import type { Observable, Subscription } from 'rxjs';

import { ObservableDisposable } from '../utils';

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

  update(items: Map<string, () => Observable<any>>) {
    this.checkDisposed();

    const currentKeys = new Set<string>();

    for (const [key, getter] of items) {
      currentKeys.add(key);

      if (!this.subscriptions.has(key)) {
        this.subscriptions.set(key, getter().subscribe());
      }
    }

    Array.from(this.subscriptions.entries()).forEach(([key, item]) => {
      if (!currentKeys.has(key)) {
        item.unsubscribe();
        this.subscriptions.delete(key);
      }
    });

    return this;
  }
}
