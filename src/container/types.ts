/**
 * The identifier of the service.
 */
export type TIdentifier<_T> = symbol & { readonly __type?: _T };

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
export interface ILifecycle<T> {
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
}

/**
 * The lifecycle type of the service.
 */
export type TLifecycleType = 'singleton' | 'transaction' | (() => object);

/**
 * The container of the service.
 */
export interface IContainer {
  /**
   * Set the lifecycle of the service.
   *
   * @param identifier - The identifier of the service.
   * @param lifecycle - The lifecycle of the service.
   * @returns The container of the service.
   */
  set<T>(identifier: TIdentifier<T>, lifecycle?: TLifecycleType): ILifecycle<T>;
  /**
   * Get the instance of the service.
   *
   * @param identifier - The identifier of the service.
   * @param tag - The tag of the service.
   * @param context - The context of the service.
   * @returns The instance of the service.
   */
  get<T>(identifier: TIdentifier<T>, tag?: string | symbol, context?: Map<symbol, any>): T;
}

export interface IServiceLocator {
  get<T>(identifier: TIdentifier<T>, tag?: string | symbol, context?: Map<symbol, any>): T;
}
