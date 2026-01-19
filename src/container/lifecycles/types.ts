/**
 * Scoped storage
 */
export interface IScopedStorage<T> {
  /**
   * Default value
   */
  defaultValue: T;
  /**
   * Instances
   */
  instances: Map<string | symbol, T>;
}
