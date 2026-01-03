import type { IContainer, ILifecycle, TIdentifier, TLifecycleType } from './types';

import { ScopedLifecycle, SingletonLifecycle, TransactionLifecycle, TransientLifecycle } from './lifecycles';

export class Container implements IContainer {
  private registry = new Map<TIdentifier<any>, ILifecycle<any>>();

  register<T>(identifier: TIdentifier<T>, lifecycle: TLifecycleType = 'singleton'): ILifecycle<T> {
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
    const lifecycle = this.registry.get(identifier) as ILifecycle<T> | undefined;
    if (!lifecycle) {
      throw new Error(`[Container]: Identifier ${String(identifier)} is not registered`);
    }

    const effectiveContext = context ?? new Map<symbol, any>();

    return lifecycle.get(this, effectiveContext, tag);
  }
}
