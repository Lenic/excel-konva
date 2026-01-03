import type { IContainer, ILifecycle, TFactory } from '../types';

export class TransientLifecycle<T> implements ILifecycle<T> {
  private defalutFactory: TFactory<T> | null;
  private factories: Map<symbol, TFactory<T>>;

  constructor() {
    this.defalutFactory = null;
    this.factories = new Map();
  }

  set(factory: TFactory<T>, tag?: string | symbol): ILifecycle<T> {
    if (tag) {
      const symbolTag = typeof tag === 'string' ? Symbol.for(tag) : tag;
      this.factories.set(symbolTag, factory);
    } else {
      this.defalutFactory = factory;
    }

    return this;
  }

  get(container: IContainer, context: Map<symbol, any>, tag?: string | symbol): T {
    if (tag) {
      const symbolTag = typeof tag === 'string' ? Symbol.for(tag) : tag;

      const fn = this.factories.get(symbolTag);
      if (!fn) {
        throw new Error(`[TransientLifecycle]: Tag ${String(tag)} not found.`);
      }
      const value = fn(container, context);

      return value;
    } else {
      if (!this.defalutFactory) {
        throw new Error(`[TransientLifecycle]: The default factory not found.`);
      }
      return this.defalutFactory(container, context);
    }
  }
}
