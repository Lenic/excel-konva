import type { ICellRange } from '../core';
import type { IAccumulatedDimensionManager, IDimensionManager } from '../data';
import type { ILayoutCache, IRectBox } from './types';

import { ObservableDisposable } from '../utils';

/**
 * Layout cache for spreadsheet cells.
 *
 * This class caches the calculated positions and sizes of cells to optimize rendering performance.
 * It uses accumulated dimension managers for rows and columns to determine coordinates.
 */
export class LayoutCache extends ObservableDisposable implements ILayoutCache {
  private row: IDimensionManager;
  private column: IDimensionManager;
  private rowA: IAccumulatedDimensionManager;
  private columnA: IAccumulatedDimensionManager;

  // Simple cache for cell rects to avoid repeated calculations
  private rectCache: Map<string, IRectBox>;

  /**
   * Initializes a new instance of the LayoutCache class.
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

    window.columnA = columnA;
    window.rowA = rowA;

    this.rectCache = new Map<string, IRectBox>();
    this.disposeWithMe(() => {
      this.rectCache.clear();
    });

    // Invalidate cache when dimensions change
    this.disposeWithMe(
      this.row.change$.subscribe((patch) => {
        if (patch.type === 'dimension') {
          this.invalidateByRow(patch.index);
        } else {
          this.rectCache.clear();
        }
      }),
    );

    this.disposeWithMe(
      this.column.change$.subscribe((patch) => {
        if (patch.type === 'dimension') {
          this.invalidateByColumn(patch.index);
        } else {
          this.rectCache.clear();
        }
      }),
    );
  }

  /**
   * Calculates the bounding box of a cell at the specified row and column indices.
   *
   * @param rowIndex - The 0-based index of the row.
   * @param columnIndex - The 0-based index of the column.
   * @returns The rectangle box encompassing the cell.
   */
  getCellRect(rowIndex: number, columnIndex: number): IRectBox {
    this.checkDisposed();

    const key = `${rowIndex}:${columnIndex}`;
    const cached = this.rectCache.get(key);
    if (cached) return cached;

    const x = this.columnA.get(columnIndex);
    const y = this.rowA.get(rowIndex);
    const width = this.column.get(columnIndex);
    const height = this.row.get(rowIndex);

    const rect: IRectBox = { x, y, width, height };
    this.rectCache.set(key, rect);

    return rect;
  }

  /**
   * Calculates the bounding boxes for all cells within a specified range.
   *
   * @param range - The cell range for which to retrieve bounding boxes.
   * @returns An array of bounding boxes for each cell in the range.
   */
  getRangeRects(range: ICellRange): IRectBox[] {
    const rects: IRectBox[] = [];
    for (let r = range.rowStartIndex; r <= range.rowEndIndex; r++) {
      for (let c = range.columnStartIndex; c <= range.columnEndIndex; c++) {
        rects.push(this.getCellRect(r, c));
      }
    }
    return rects;
  }

  /**
   * Invalidates the cached layout information for a specific range of cells.
   *
   * @param range - The cell range to invalidate.
   */
  invalidateRange(range: ICellRange): void {
    for (let r = range.rowStartIndex; r <= range.rowEndIndex; r++) {
      for (let c = range.columnStartIndex; c <= range.columnEndIndex; c++) {
        this.rectCache.delete(`${r}:${c}`);
      }
    }
  }

  /**
   * Invalidates all cached cell layouts starting from the specified row index.
   *
   * @param rowIndex - The starting row index for invalidation.
   */
  invalidateByRow(rowIndex: number): void {
    const keysToDelete: string[] = [];
    this.rectCache.forEach((_, key) => {
      const row = parseInt(key.split(':')[0], 10);
      if (row >= rowIndex) {
        keysToDelete.push(key);
      }
    });

    for (const key of keysToDelete) {
      this.rectCache.delete(key);
    }
  }

  /**
   * Invalidates all cached cell layouts starting from the specified column index.
   *
   * @param columnIndex - The starting column index for invalidation.
   */
  invalidateByColumn(columnIndex: number): void {
    const keysToDelete: string[] = [];
    this.rectCache.forEach((_, key) => {
      const col = parseInt(key.split(':')[1], 10);
      if (col >= columnIndex) {
        keysToDelete.push(key);
      }
    });

    for (const key of keysToDelete) {
      this.rectCache.delete(key);
    }
  }
}
