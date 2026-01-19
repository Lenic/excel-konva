import type { IScopedStorage } from './types';

import { DEFAULT_TAG_VALUE, TRANSACTION_INSTANCES_KEY } from './constants';
import { BaseLifecycle } from './core';

/**
 * Transaction lifecycle
 */
export class TransactionLifecycle<T> extends BaseLifecycle<T> {
  protected getStorage(context: Map<symbol, any>) {
    let cache = context.get(TRANSACTION_INSTANCES_KEY) as Map<symbol, IScopedStorage<T>> | undefined;
    if (!cache) {
      cache = new Map<symbol, IScopedStorage<T>>();
      context.set(TRANSACTION_INSTANCES_KEY, cache);
    }
    let storage = cache.get(this.identifier);
    if (!storage) {
      storage = {
        defaultValue: DEFAULT_TAG_VALUE as unknown as T,
        instances: new Map<string | symbol, T>(),
      };
      cache.set(this.identifier, storage);
    }
    return storage;
  }

  protected tryGetStorage() {
    return undefined;
  }
}
