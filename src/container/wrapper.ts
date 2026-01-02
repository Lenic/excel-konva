import type { IServiceLocator, TIdentifier } from './types';

export class ServiceLocator implements IServiceLocator {
  private static _current: IServiceLocator;

  static get current(): IServiceLocator {
    return ServiceLocator._current;
  }

  static setProvider(current: IServiceLocator): void {
    ServiceLocator._current = current;
  }

  get<T>(identifier: TIdentifier<T>, tag?: symbol, context?: Map<symbol, any>): T {
    return this.get(identifier, tag, context);
  }
}
