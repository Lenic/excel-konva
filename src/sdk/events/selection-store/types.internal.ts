import type { ISelectionRegion } from './types';

/**
 * Defines the internal actions available for modifying the selection store.
 */
export type TSelectionStoreAction =
  /**
   * Removals or duplicate detection for selection regions.
   */
  | { type: 'delete' | 'distinct'; id: number }
  /**
   * Adds or updates an existing selection region.
   */
  | { type: 'add' | 'update'; region: ISelectionRegion }
  /**
   * Complete reset of the selection storage.
   */
  | { type: 'reset'; regions?: ISelectionRegion[] };
