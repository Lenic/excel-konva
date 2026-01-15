import type { IContainer, ILifecycle, TFactory } from '../types';

import { Disposable } from '../disposable';

/**
 * Transient lifecycle
 */
export class TransientLifecycle<T> extends Disposable implements ILifecycle<T> {
  private defalutFactory: TFactory<T> | null;
  private factories: Map<string | symbol, TFactory<T>>;

  /**
   * Constructor
   */
  constructor() {
    super();

    this.defalutFactory = null;
    this.factories = new Map<string | symbol, TFactory<T>>();

    this.disposeWithMe(() => {
      this.defalutFactory = null;
      this.factories.clear();
    });
  }

  set(factory: TFactory<T>, tag?: string | symbol): ILifecycle<T> {
    this.checkDisposed();

    if (tag) {
      this.factories.set(tag, factory);
    } else {
      this.defalutFactory = factory;
    }

    return this;
  }

  get(container: IContainer, context: Map<symbol, any>, tag?: string | symbol): T {
    this.checkDisposed();

    if (tag) {
      const fn = this.factories.get(tag);
      if (!fn) {
        throw new Error(`[TransientLifecycle]: Tag ${String(tag)} not found.`);
      }
      const value = fn(container, context);

      return value;
    } else {
      if (!this.defalutFactory) {
        throw new Error(`[TransientLifecycle]: The default factory not found.`);
      }
      return this.defalutFactory(container, context);
    }
  }
}
