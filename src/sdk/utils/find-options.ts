import type { IAccumulatedFindOptions } from '../data';

/**
 * Creates a new instance of IAccumulatedFindOptions with default values.
 *
 * @param exact The exact value to use for the find operation.
 * @returns A new IAccumulatedFindOptions object.
 */
export function createNewFindOptions(exact = 0): IAccumulatedFindOptions {
  return { cache: { index: -1, offset: -1 }, exact };
}
