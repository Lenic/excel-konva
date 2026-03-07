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
      lifecycleInstance = new SingletonLifecycle(identifier);
    } else if (lifecycle === 'transaction') {
      lifecycleInstance = new TransactionLifecycle(identifier);
    } else if (lifecycle === 'transient') {
      lifecycleInstance = new TransientLifecycle(identifier);
    } else {
      lifecycleInstance = new ScopedLifecycle(identifier, lifecycle);
    }

    this.registry.set(identifier, lifecycleInstance);
    return lifecycleInstance;
  }

  get<T>(identifier: TIdentifier<T>, context?: Map<symbol, any>): T;
  get<T>(identifier: TIdentifier<T>, tag?: string | symbol, context?: Map<symbol, any>): T;
  get<T>(...args: any[]): T {
    if (args.length === 1) {
      return this.buildGet(
        args[0] as TIdentifier<T>,
        (lifecycle, effectiveContext) => lifecycle.get(this, effectiveContext),
        undefined,
      );
    } else if (args.length === 2) {
      if (typeof args[1] === 'string' || typeof args[1] === 'symbol') {
        return this.buildGet(
          args[0] as TIdentifier<T>,
          (lifecycle, effectiveContext) => lifecycle.get(this, effectiveContext, args[1] as string | symbol),
          undefined,
        );
      } else {
        return this.buildGet(
          args[0] as TIdentifier<T>,
          (lifecycle, effectiveContext) => lifecycle.get(this, effectiveContext),
          args[1] as Map<symbol, any>,
        );
      }
    } else {
      return this.buildGet(
        args[0] as TIdentifier<T>,
        (lifecycle, effectiveContext) => lifecycle.get(this, effectiveContext, args[1] as string | symbol),
        args[2] as Map<symbol, any>,
      );
    }
  }

  getAll<T>(identifier: TIdentifier<T>, context?: Map<symbol, any>): Map<string | symbol, T> {
    return this.buildGet(
      identifier,
      (lifecycle, effectiveContext) => lifecycle.getAll(this, effectiveContext),
      context,
    );
  }

  private buildGet<T, R>(
    identifier: TIdentifier<T>,
    getter: (lifecycle: ILifecycle<T>, effectiveContext: Map<symbol, any>) => R,
    context?: Map<symbol, any>,
  ): R {
    this.checkDisposed();

    const lifecycle = this.registry.get(identifier) as ILifecycle<T> | undefined;
    if (!lifecycle) {
      throw new Error(`[Container]: Lifecycle ${String(identifier)} is not registered`);
    }

    const effectiveContext = context ?? new Map<symbol, any>();

    return getter(lifecycle, effectiveContext);
  }
}
