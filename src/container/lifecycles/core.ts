import type { IContainer, ILifecycle, TFactory, TIdentifier } from '../types';
import type { IScopedStorage } from './types';

import { Disposable } from '../disposable';
import { isDisposable } from '../utils';

import { DEFAULT_TAG_VALUE } from './constants';

/**
 * Base lifecycle
 */
export abstract class BaseLifecycle<T> extends Disposable implements ILifecycle<T> {
  private factories: Map<string | symbol, TFactory<T>>;
  private defalutFactory: TFactory<T> | null;

  /**
   * Type identifier
   */
  protected identifier: TIdentifier<T>;

  /**
   * Constructor
   *
   * @param identifier - Type identifier
   */
  constructor(identifier: TIdentifier<T>) {
    super();

    this.factories = new Map<string | symbol, TFactory<T>>();
    this.defalutFactory = null;
    this.identifier = identifier;

    this.disposeWithMe(() => {
      this.defalutFactory = null;
      this.factories.clear();
      this.identifier = null as unknown as TIdentifier<T>;

      const storage = this.tryGetStorage();
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
    this.checkDisposed();

    const storage = this.tryGetStorage();
    if (tag) {
      this.factories.set(tag, factory);
      storage?.instances.delete(tag);
    } else {
      this.defalutFactory = factory;
      if (storage) {
        storage.defaultValue = DEFAULT_TAG_VALUE as unknown as T;
      }
    }

    return this;
  }

  get(container: IContainer, context: Map<symbol, any>, tag?: string | symbol): T {
    this.checkDisposed();

    const storage = this.getStorage(context);
    if (tag) {
      let value = storage.instances.get(tag);
      if (value) return value;

      const fn = this.factories.get(tag);
      if (!fn) {
        throw new Error(`[Lifecycle<${String(this.identifier)}>]: Tag ${String(tag)} not found.`);
      }
      value = fn(container, context);

      storage.instances.set(tag, value);
      return value;
    } else {
      return this.getDefaultValue(container, context, storage);
    }
  }

  getAll(container: IContainer, context: Map<symbol, any>): Map<string | symbol, T> {
    this.checkDisposed();

    const storage = this.getStorage(context);
    if (!storage.instances.has('')) {
      storage.instances.set('', this.getDefaultValue(container, context, storage));
    }

    if (storage.instances.size !== this.factories.size + 1) {
      for (const [tag, factory] of this.factories) {
        if (storage.instances.has(tag)) continue;

        storage.instances.set(tag, factory(container, context));
      }
    }

    return storage.instances;
  }

  private getDefaultValue(container: IContainer, context: Map<symbol, any>, storage: IScopedStorage<T>) {
    if (storage.defaultValue !== DEFAULT_TAG_VALUE) return storage.defaultValue;

    if (!this.defalutFactory) {
      throw new Error(`[Lifecycle<${String(this.identifier)}>]: The default factory not found.`);
    }
    storage.defaultValue = this.defalutFactory(container, context);
    // Add the default instance to the instances map
    storage.instances.set('', storage.defaultValue);

    return storage.defaultValue;
  }

  /**
   * Get storage
   *
   * @param context - Context
   */
  protected abstract getStorage(context: Map<symbol, any>): IScopedStorage<T>;

  /**
   * Try get storage
   */
  protected abstract tryGetStorage(): IScopedStorage<T> | undefined;
}
