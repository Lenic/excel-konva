import type { IServiceLocator } from './types';

/**
 * Service locator
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ServiceLocator {
  private static _current: IServiceLocator;

  /**
   * Get the current service locator
   */
  static get current(): IServiceLocator {
    return ServiceLocator._current;
  }

  /**
   * Set the current service locator
   */
  static setProvider(current: IServiceLocator): void {
    ServiceLocator._current = current;
  }
}
