import type { TIdentifier } from '../types';
import type { IScopedStorage } from './types';

import { DEFAULT_TAG_VALUE } from './constants';
import { BaseLifecycle } from './core';

/**
 * Singleton lifecycle
 */
export class SingletonLifecycle<T> extends BaseLifecycle<T> {
  storage: IScopedStorage<T>;

  /**
   * Constructor
   *
   * @param identifier - Identifier
   */
  constructor(identifier: TIdentifier<T>) {
    super(identifier);

    this.storage = {
      defaultValue: DEFAULT_TAG_VALUE as unknown as T,
      instances: new Map<string | symbol, T>(),
    };
  }

  protected getStorage() {
    return this.storage;
  }

  protected tryGetStorage() {
    return this.storage;
  }
}
