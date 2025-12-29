import { Subscription } from 'rxjs';

/**
 * Disposable interface
 */
export interface IDisposable {
  /**
   * Whether it has been disposed
   */
  isDisposed: boolean;

  /**
   * Dispose
   */
  dispose(): void;
  /**
   * Dispose with me
   */
  disposeWithMe(disposable: Subscription | IDisposable | (() => void)): void;
}

function isDisposable(disposable: any): disposable is IDisposable {
  return disposable instanceof Disposable || 'dispose' in disposable;
}

/**
 * Disposable
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

  disposeWithMe(disposable: Subscription | IDisposable | (() => void)): void {
    if (disposable instanceof Subscription) {
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
