/**
 * Subscription interface
 */
export interface ISubscription {
  /**
   * Unsubscribe
   */
  unsubscribe(): void;
}

/**
 * Disposable interface
 */
export interface IDisposable {
  /**
   * Whether it has been disposed
   */
  isDisposed: boolean;

  /**
   * Dispose
   */
  dispose(): void;
  /**
   * Dispose with me
   */
  disposeWithMe(disposable: ISubscription | IDisposable | (() => void)): void;
}

/**
 * The symbol of the identifier.
 */
export const IdentifierSymbol = Symbol('IdentifierSymbol');
/**
 * The identifier of the service.
 */
export type TIdentifier<T> = symbol & { readonly [IdentifierSymbol]?: T };

/**
 * The factory of the service.
 *
 * @param container - The container of the service.
 * @param context - The context of the service.
 * @returns The instance of the service.
 */
export type TFactory<T> = (container: IContainer, context: Map<symbol, any>) => T;

/**
 * The lifecycle of the service.
 */
export interface ILifecycle<T> extends IDisposable {
  /**
   * Set the factory of the service.
   *
   * @param factory - The factory of the service.
   * @param tag - The tag of the service.
   * @returns The lifecycle of the service.
   */
  set(factory: TFactory<T>, tag?: string | symbol): ILifecycle<T>;
  /**
   * Get the instance of the service.
   *
   * @param container - The container of the service.
   * @param context - The context of the service.
   * @param tag - The tag of the service.
   * @returns The instance of the service.
   */
  get(container: IContainer, context: Map<symbol, any>, tag?: string | symbol): T;
  /**
   * Get all the instances of the service.
   *
   * - with the default instance.
   *
   * @param container - The container of the service.
   * @param context - The context of the service.
   * @returns The instances of the service.
   */
  getAll(container: IContainer, context: Map<symbol, any>): Map<string | symbol, T>;
}

/**
 * The lifecycle type of the service.
 */
export type TLifecycleType = 'singleton' | 'transaction' | 'transient' | (() => object | null);

/**
 * The container of the service.
 */
export interface IContainer extends IDisposable {
  /**
   * Register the service.
   *
   * @param identifier - The identifier of the service.
   * @param lifecycle - The lifecycle of the service, default is 'singleton'.
   * @returns The container of the service.
   */
  register<T>(identifier: TIdentifier<T>, lifecycle?: TLifecycleType): ILifecycle<T>;
  /**
   * Get the instance of the service.
   *
   * @param identifier - The identifier of the service.
   * @param tag - The tag of the service.
   * @param context - The context of the service.
   * @returns The instance of the service.
   */
  get<T>(identifier: TIdentifier<T>, tag?: string | symbol, context?: Map<symbol, any>): T;
  /**
   * Get all the instances of the service.
   *
   * - with the default instance.
   *
   * @param identifier - The identifier of the service.
   * @param context - The context of the service.
   * @returns The instances of the service.
   */
  getAll<T>(identifier: TIdentifier<T>, context?: Map<symbol, any>): Map<string | symbol, T>;
}

/**
 * Service locator interface
 */
export interface IServiceLocator {
  /**
   * Get the instance of the service.
   *
   * @param identifier - The identifier of the service.
   * @param tag - The tag of the service.
   * @param context - The context of the service.
   * @returns The instance of the service.
   */
  get<T>(identifier: TIdentifier<T>, tag?: string | symbol, context?: Map<symbol, any>): T;
  /**
   * Get all the instances of the service.
   *
   * - with the default instance.
   *
   * @param identifier - The identifier of the service.
   * @param context - The context of the service.
   * @returns The instances of the service.
   */
  getAll<T>(identifier: TIdentifier<T>, context?: Map<symbol, any>): Map<string | symbol, T>;
}
