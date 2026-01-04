import type { IDisposable, ISubscription } from './types';

import { isDisposable, isSubscription } from './utils';

/**
 * Disposable class
 */
export class Disposable implements IDisposable {
  private subscriptionList: (() => void)[] = [];

  isDisposed = false;

  dispose(): void {
    if (this.isDisposed) return;

    this.subscriptionList.forEach((fn) => {
      fn();
    });
    this.subscriptionList = [];
    this.isDisposed = true;
  }

  disposeWithMe(disposable: ISubscription | IDisposable | (() => void)): void {
    if (isSubscription(disposable)) {
      this.subscriptionList.push(() => {
        disposable.unsubscribe();
      });
    } else if (isDisposable(disposable)) {
      this.subscriptionList.push(() => {
        disposable.dispose();
      });
    } else {
      this.subscriptionList.push(disposable);
    }
  }
}
