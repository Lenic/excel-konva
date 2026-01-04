import { BehaviorSubject } from 'rxjs';

import { Disposable } from '../../container';

/**
 * Observable disposable class
 */
export class ObservableDisposable extends Disposable {
  protected dispositionSubject: BehaviorSubject<number>;

  /**
   * Observable disposable constructor
   */
  constructor() {
    super();

    this.dispositionSubject = new BehaviorSubject(0);
    this.disposeWithMe(() => {
      this.dispositionSubject.complete();
    });
  }
}
