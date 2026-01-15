import type { IContainer, ILifecycle, TIdentifier, TLifecycleType } from './types';

import { Disposable } from './disposable';
import { ScopedLifecycle, SingletonLifecycle, TransactionLifecycle, TransientLifecycle } from './lifecycles';

/**
 * Container class
 */
export class Container extends Disposable implements IContainer {
  private registry: Map<TIdentifier<any>, ILifecycle<any>>;

  constructor() {
    super();

    this.registry = new Map<TIdentifier<any>, ILifecycle<any>>();

    this.disposeWithMe(() => {
      for (const lifecycle of this.registry.values()) {
        lifecycle.dispose();
      }
      this.registry.clear();
    });
  }

  register<T>(identifier: TIdentifier<T>, lifecycle: TLifecycleType = 'singleton'): ILifecycle<T> {
    this.checkDisposed();

    let lifecycleInstance = this.registry.get(identifier) as ILifecycle<T> | undefined;
    if (lifecycleInstance) return lifecycleInstance;

    if (lifecycle === 'singleton') {
      lifecycleInstance = new SingletonLifecycle();
    } else if (lifecycle === 'transaction') {
      lifecycleInstance = new TransactionLifecycle();
    } else if (lifecycle === 'transient') {
      lifecycleInstance = new TransientLifecycle();
    } else {
      lifecycleInstance = new ScopedLifecycle(lifecycle);
    }

    this.registry.set(identifier, lifecycleInstance);
    return lifecycleInstance;
  }

  get<T>(identifier: TIdentifier<T>, tag?: string | symbol, context?: Map<symbol, any>): T {
    this.checkDisposed();

    const lifecycle = this.registry.get(identifier) as ILifecycle<T> | undefined;
    if (!lifecycle) {
      throw new Error(`[Container]: Identifier ${String(identifier)} is not registered`);
    }

    const effectiveContext = context ?? new Map<symbol, any>();

    return lifecycle.get(this, effectiveContext, tag);
  }
}
