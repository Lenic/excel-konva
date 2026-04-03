import type { ISelectionRegion } from './types';

export type TSelectionStoreAction =
  | { type: 'delete' | 'distinct'; id: number }
  | { type: 'add' | 'update'; region: ISelectionRegion }
  | { type: 'reset'; regions?: ISelectionRegion[] };
