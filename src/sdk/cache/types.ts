import type { TIdentifier } from '../../container';

/**
 * Accumulated dimension of items
 */
export interface IAccumulatedDimensionManager {
  /**
   * Get accumulated dimension
   *
   * - The accumulated dimension of the first item is 0
   *
   * @param index - Item index
   * @returns Accumulated dimension
   */
  get(index: number): number;
  /**
   * Find index by accumulated dimension
   *
   * @param offset - Accumulated dimension
   * @returns Item index
   */
  findIndex(offset: number): number;
}
export const IAccumulatedDimensionManager: TIdentifier<IAccumulatedDimensionManager> =
  Symbol('IAccumulatedDimensionManager');
