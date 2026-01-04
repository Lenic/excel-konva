import type { IContainer, ILifecycle, TFactory } from '../types';

import { Disposable } from '../disposable';
import { isDisposable } from '../utils';

import { DEFAULT_TAG_VALUE } from './constants';

interface IScopedStorage<T> {
  defaultValue: T;
  instances: Map<symbol, T>;
}

const scopedInstances = new WeakMap<object, IScopedStorage<any>>();

/**
 * Scoped lifecycle
 */
export class ScopedLifecycle<T> extends Disposable implements ILifecycle<T> {
  private factories: Map<symbol, TFactory<T>>;
  private defalutFactory: TFactory<T> | null;

  private getScopeKey: () => object;

  /**
   * Constructor
   * @param getScopeKey - Get scope key
   */
  constructor(getScopeKey: () => object) {
    super();

    this.getScopeKey = getScopeKey;

    this.factories = new Map();
    this.defalutFactory = null;

    this.disposeWithMe(() => {
      this.defalutFactory = null;
      this.factories.clear();

      const storage = scopedInstances.get(this.getScopeKey());
      if (!storage) return;

      if (storage.defaultValue && isDisposable(storage.defaultValue)) {
        storage.defaultValue.dispose();
      }
      storage.defaultValue = DEFAULT_TAG_VALUE as unknown as T;

      for (const instance of storage.instances.values()) {
        if (instance && isDisposable(instance)) {
          instance.dispose();
        }
      }
      storage.instances.clear();
    });
  }

  set(factory: TFactory<T>, tag?: string | symbol): ILifecycle<T> {
    const storage = this.getStorage();
    if (tag) {
      const symbolTag = typeof tag === 'string' ? Symbol.for(tag) : tag;
      this.factories.set(symbolTag, factory);
      storage.instances.delete(symbolTag);
    } else {
      this.defalutFactory = factory;
      storage.defaultValue = DEFAULT_TAG_VALUE as unknown as T;
    }

    return this;
  }

  get(container: IContainer, context: Map<symbol, any>, tag?: string | symbol): T {
    const storage = this.getStorage();

    if (tag) {
      const symbolTag = typeof tag === 'string' ? Symbol.for(tag) : tag;
      let value = storage.instances.get(symbolTag);
      if (value) return value;

      const fn = this.factories.get(symbolTag);
      if (!fn) {
        throw new Error(`[ScopedLifecycle]: Tag ${String(tag)} not found.`);
      }
      value = fn(container, context);

      storage.instances.set(symbolTag, value);
      return value;
    } else {
      if (storage.defaultValue !== DEFAULT_TAG_VALUE) return storage.defaultValue;

      if (!this.defalutFactory) {
        throw new Error(`[ScopedLifecycle]: The default factory not found.`);
      }
      storage.defaultValue = this.defalutFactory(container, context);

      return storage.defaultValue;
    }
  }

  private getStorage(): IScopedStorage<T> {
    const scopeKey = this.getScopeKey();
    let storage = scopedInstances.get(scopeKey) as IScopedStorage<T> | undefined;
    if (!storage) {
      storage = {
        defaultValue: DEFAULT_TAG_VALUE as unknown as T,
        instances: new Map(),
      };
      scopedInstances.set(scopeKey, storage);
    }
    return storage;
  }
}
