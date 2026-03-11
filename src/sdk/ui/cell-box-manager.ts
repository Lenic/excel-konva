import type { ICellRange } from '../core';
import type { IAccumulatedDimensionManager, IDimensionManager } from '../data';
import type { ICellBoxManager, IRectBox } from './types';

import { ObservableDisposable } from '../utils';

/**
 * Implementation of the `ICellBoxManager` that calculates and caches cell
 * geometry information.
 *
 * It coordinates with dimension managers to determine exact coordinates (x, y)
 * and sizes (width, height) for cells, using an internal cache to avoid
 * redundant calculations during spreadsheet rendering.
 */
export class CellBoxManager extends ObservableDisposable implements ICellBoxManager {
  private row: IDimensionManager;
  private column: IDimensionManager;
  private rowA: IAccumulatedDimensionManager;
  private columnA: IAccumulatedDimensionManager;

  /**
   * Initializes a new instance of the CellBoxManager class.
   *
   * @param row - The manager for individual row dimensions.
   * @param column - The manager for individual column dimensions.
   * @param rowA - The manager for accumulated row dimensions.
   * @param columnA - The manager for accumulated column dimensions.
   */
  constructor(
    row: IDimensionManager,
    column: IDimensionManager,
    rowA: IAccumulatedDimensionManager,
    columnA: IAccumulatedDimensionManager,
  ) {
    super();

    this.row = row;
    this.column = column;
    this.rowA = rowA;
    this.columnA = columnA;
  }

  getCellBox(rowIndex: number, columnIndex: number): IRectBox {
    this.checkDisposed();

    const x = this.columnA.get(columnIndex);
    const y = this.rowA.get(rowIndex);
    const width = this.column.get(columnIndex);
    const height = this.row.get(rowIndex);

    return { x, y, width, height };
  }

  getCellBoxListByRange(range: ICellRange): IRectBox[] {
    const rects: IRectBox[] = [];
    for (let r = range.rowStartIndex; r <= range.rowEndIndex; r++) {
      for (let c = range.columnStartIndex; c <= range.columnEndIndex; c++) {
        rects.push(this.getCellBox(r, c));
      }
    }
    return rects;
  }
}
