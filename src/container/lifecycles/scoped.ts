import type { TIdentifier } from '../types';
import type { IScopedStorage } from './types';

import { DEFAULT_TAG_VALUE } from './constants';
import { BaseLifecycle } from './core';

const scopedInstances = new WeakMap<object, IScopedStorage<any>>();

/**
 * Scoped lifecycle
 */
export class ScopedLifecycle<T> extends BaseLifecycle<T> {
  private getScopeKey: () => object | null;

  /**
   * Constructor
   *
   * @param identifier - Type identifier
   * @param getScopeKey - Get scope key
   */
  constructor(identifier: TIdentifier<T>, getScopeKey: () => object | null) {
    super(identifier);

    this.getScopeKey = getScopeKey;
    this.disposeWithMe(() => void (this.getScopeKey = null as unknown as () => object | null));
  }

  protected getStorage() {
    const scopeKey = this.getScopeKey();
    if (!scopeKey) {
      throw new Error(`[ScopedLifecycle<${String(this.identifier)}>]: Scope key is not defined`);
    }

    let storage = scopedInstances.get(scopeKey) as IScopedStorage<T> | undefined;
    if (!storage) {
      storage = {
        defaultValue: DEFAULT_TAG_VALUE as unknown as T,
        instances: new Map<string | symbol, T>(),
      };
      scopedInstances.set(scopeKey, storage);
    }
    return storage;
  }

  protected tryGetStorage() {
    const scopeKey = this.getScopeKey();
    if (!scopeKey) {
      return undefined;
    }
    return scopedInstances.get(scopeKey);
  }
}
