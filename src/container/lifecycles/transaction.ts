import type { IContainer, ILifecycle, TFactory } from '../types';

import { Disposable } from '../disposable';

/**
 * Transaction lifecycle
 */
export class TransactionLifecycle<T> extends Disposable implements ILifecycle<T> {
  private instancesKey: symbol;
  private defaultInstanceKey: symbol;
  private defalutFactory: TFactory<T> | null;
  private factories: Map<symbol, TFactory<T>>;

  /**
   * Constructor
   */
  constructor() {
    super();

    this.factories = new Map();
    this.defalutFactory = null;
    this.instancesKey = Symbol('transaction_instance_key');
    this.defaultInstanceKey = Symbol('default_instance_key');

    this.disposeWithMe(() => {
      this.factories.clear();
      this.defalutFactory = null;
    });
  }

  set(factory: TFactory<T>, tag?: string | symbol): ILifecycle<T> {
    if (tag) {
      const symbolTag = typeof tag === 'string' ? Symbol.for(tag) : tag;
      this.factories.set(symbolTag, factory);
    } else {
      this.defalutFactory = factory;
    }

    return this;
  }

  get(container: IContainer, context: Map<symbol, any>, tag?: string | symbol): T {
    let instances = context.get(this.instancesKey) as Map<symbol, T> | undefined;
    if (!instances) {
      instances = new Map();
      context.set(this.instancesKey, instances);
    }

    if (tag) {
      const symbolTag = typeof tag === 'string' ? Symbol.for(tag) : tag;
      let value = instances.get(symbolTag);
      if (value) return value;

      const fn = this.factories.get(symbolTag);
      if (!fn) {
        throw new Error(`[TransactionLifecycle]: Tag ${String(tag)} not found.`);
      }
      value = fn(container, context);

      instances.set(symbolTag, value);
      return value;
    } else {
      let defaultValue = context.get(this.defaultInstanceKey) as T | undefined;
      if (defaultValue) return defaultValue;

      if (!this.defalutFactory) {
        throw new Error(`[TransactionLifecycle]: The default factory not found.`);
      }
      defaultValue = this.defalutFactory(container, context);

      context.set(this.defaultInstanceKey, defaultValue);
      return defaultValue;
    }
  }
}
