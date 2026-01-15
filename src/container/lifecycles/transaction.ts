import type { IContainer, ILifecycle, TFactory } from '../types';

import { Disposable } from '../disposable';

import { TRANSACTION_DEFAULT_INSTANCE_KEY, TRANSACTION_INSTANCES_KEY } from './constants';

/**
 * Transaction lifecycle
 */
export class TransactionLifecycle<T> extends Disposable implements ILifecycle<T> {
  private defalutFactory: TFactory<T> | null;
  private factories: Map<string | symbol, TFactory<T>>;

  /**
   * Constructor
   */
  constructor() {
    super();

    this.factories = new Map<string | symbol, TFactory<T>>();
    this.defalutFactory = null;

    this.disposeWithMe(() => {
      this.factories.clear();
      this.defalutFactory = null;
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

    let instances = context.get(TRANSACTION_INSTANCES_KEY) as Map<string | symbol, T> | undefined;
    if (!instances) {
      instances = new Map<string | symbol, T>();
      context.set(TRANSACTION_INSTANCES_KEY, instances);
    }

    if (tag) {
      let value = instances.get(tag);
      if (value) return value;

      const fn = this.factories.get(tag);
      if (!fn) {
        throw new Error(`[TransactionLifecycle]: Tag ${String(tag)} not found.`);
      }
      value = fn(container, context);

      instances.set(tag, value);
      return value;
    } else {
      let defaultValue = context.get(TRANSACTION_DEFAULT_INSTANCE_KEY) as T | undefined;
      if (defaultValue) return defaultValue;

      if (!this.defalutFactory) {
        throw new Error(`[TransactionLifecycle]: The default factory not found.`);
      }
      defaultValue = this.defalutFactory(container, context);

      context.set(TRANSACTION_DEFAULT_INSTANCE_KEY, defaultValue);
      return defaultValue;
    }
  }
}
