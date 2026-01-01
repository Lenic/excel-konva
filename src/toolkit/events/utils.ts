import type { ISelectionRegion } from './types';

/**
 * Check if two selection regions are the same.
 *
 * @param region1 - The first selection region.
 * @param region2 - The second selection region.
 * @returns `true` if the two selection regions are the same, `false` otherwise.
 */
export const isSameSelectionRegion = (region1: ISelectionRegion, region2: ISelectionRegion) => {
  return (
    region1.activeCell.rowIndex === region2.activeCell.rowIndex &&
    region1.activeCell.columnIndex === region2.activeCell.columnIndex &&
    region1.region.startRowIndex === region2.region.startRowIndex &&
    region1.region.startColumnIndex === region2.region.startColumnIndex &&
    region1.region.endRowIndex === region2.region.endRowIndex &&
    region1.region.endColumnIndex === region2.region.endColumnIndex
  );
};
