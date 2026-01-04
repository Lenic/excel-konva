import type { IContainer, ILifecycle, TFactory } from '../types';

import { Disposable } from '../disposable';
import { isDisposable } from '../utils';

import { DEFAULT_TAG_VALUE } from './constants';

/**
 * Singleton lifecycle
 */
export class SingletonLifecycle<T> extends Disposable implements ILifecycle<T> {
  private defaultValue: T;
  private instances: Map<symbol, T>;
  private defalutFactory: TFactory<T> | null;
  private factories: Map<symbol, TFactory<T>>;

  /**
   * Constructor
   */
  constructor() {
    super();

    this.defalutFactory = null;
    this.factories = new Map();
    this.instances = new Map();
    this.defaultValue = DEFAULT_TAG_VALUE as unknown as T;

    this.disposeWithMe(() => {
      this.defalutFactory = null;
      if (this.defaultValue && isDisposable(this.defaultValue)) {
        this.defaultValue.dispose();
      }
      this.defaultValue = DEFAULT_TAG_VALUE as unknown as T;

      this.factories.clear();
      for (const instance of this.instances.values()) {
        if (instance && isDisposable(instance)) {
          instance.dispose();
        }
      }
      this.instances.clear();
    });
  }

  set(factory: TFactory<T>, tag?: string | symbol): ILifecycle<T> {
    if (tag) {
      const symbolTag = typeof tag === 'string' ? Symbol.for(tag) : tag;
      this.factories.set(symbolTag, factory);
      this.instances.delete(symbolTag);
    } else {
      this.defalutFactory = factory;
      this.defaultValue = DEFAULT_TAG_VALUE as unknown as T;
    }

    return this;
  }

  get(container: IContainer, context: Map<symbol, any>, tag?: string | symbol): T {
    if (tag) {
      const symbolTag = typeof tag === 'string' ? Symbol.for(tag) : tag;
      let value = this.instances.get(symbolTag);
      if (value) return value;

      const fn = this.factories.get(symbolTag);
      if (!fn) {
        throw new Error(`[SingletonLifecycle]: Tag ${String(tag)} not found.`);
      }
      value = fn(container, context);

      this.instances.set(symbolTag, value);
      return value;
    } else {
      if (this.defaultValue !== DEFAULT_TAG_VALUE) return this.defaultValue;

      if (!this.defalutFactory) {
        throw new Error(`[SingletonLifecycle]: The default factory not found.`);
      }
      this.defaultValue = this.defalutFactory(container, context);

      return this.defaultValue;
    }
  }
}
