/**
 * Returns a default value for a generic type by casting undefined.
 *
 * This utility is useful for initializing variables or properties that will be
 * assigned later but need a placeholder of the correct type for the compiler.
 *
 * @template T - The target type for the default value.
 * @returns Undefined cast as the specified type T.
 */
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function getDefaultValue<T>() {
  return undefined as unknown as T;
}
