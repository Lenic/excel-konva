import type { IScopedStorage } from './types';

import { DEFAULT_TAG_VALUE } from './constants';
import { BaseLifecycle } from './core';

/**
 * Transient lifecycle
 */
export class TransientLifecycle<T> extends BaseLifecycle<T> {
  protected getStorage() {
    const storage: IScopedStorage<T> = {
      defaultValue: DEFAULT_TAG_VALUE as unknown as T,
      instances: new Map<string | symbol, T>(),
    };
    return storage;
  }

  protected tryGetStorage() {
    return undefined;
  }
}
