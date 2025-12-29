import type { IRectBox } from '../types';
import type { ICellManager, IDimensionManager, IItemBoundaryManager } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, map, scan, shareReplay, startWith, Subject, withLatestFrom } from 'rxjs';

import { Disposable, getCellKey, getColumnLabel } from '../core';

/**
 * Cell manager
 */
export class CellManager extends Disposable implements ICellManager {
  private cellDataSubject: Subject<[string, string | null]>;

  columnDimensionManager: IDimensionManager;
  rowDimensionManager: IDimensionManager;
  itemBoundaryManager: IItemBoundaryManager;

  cellContentStore: Map<string, string>;
  getCellData$: Observable<(rowIndex: number, columnIndex: number) => string>;
  getCellRectBox$: Observable<(rowIndex: number, columnIndex: number) => IRectBox>;

  /**
   * Constructor
   *
   * @param columnDimensionManager - Column dimension manager
   * @param rowDimensionManager - Row dimension manager
   * @param itemBoundaryManager - Item boundary manager
   */
  constructor(
    columnDimensionManager: IDimensionManager,
    rowDimensionManager: IDimensionManager,
    itemBoundaryManager: IItemBoundaryManager,
  ) {
    super();

    this.columnDimensionManager = columnDimensionManager;
    this.rowDimensionManager = rowDimensionManager;
    this.itemBoundaryManager = itemBoundaryManager;

    this.cellDataSubject = new Subject<[string, string | null]>();
    this.disposeWithMe(() => {
      this.cellDataSubject.complete();
    });

    this.cellContentStore = new Map<string, string>();
    this.disposeWithMe(() => {
      this.cellContentStore.clear();
    });

    this.getCellData$ = this.buildGetCellData();
    this.disposeWithMe(this.getCellData$.subscribe());

    this.getCellRectBox$ = this.buildGetCellRectBox();
    this.disposeWithMe(this.getCellRectBox$.subscribe());
  }

  setCellData(key: string, value: string | null): void;
  setCellData(rowIndex: number, columnIndex: number, value: string | null): void;
  setCellData(...args: any[]) {
    if (args.length === 2) {
      this.cellDataSubject.next(args as [string, string | null]);
    } else {
      this.cellDataSubject.next([getCellKey(args[0] as number, args[1] as number), args[2]] as [string, string | null]);
    }
  }

  private buildGetCellData() {
    return this.cellDataSubject.pipe(
      startWith(null),
      scan((acc, item) => {
        if (item === null) return acc;

        const [key, value] = item;
        if (value === null) {
          acc.delete(key);
          return acc;
        } else {
          acc.set(key, value);
          return acc;
        }
      }, this.cellContentStore),
      map((store) => {
        /**
         * Get the content of the specified cell.
         *
         * @param rowIndex - The row index, starting from 0.
         * @param columnIndex - The column index, starting from 0.
         */
        return function getCellData(rowIndex: number, columnIndex: number) {
          const isHeaderRow = rowIndex === 0;
          const isRowIndexCol = columnIndex === 0;

          if (isHeaderRow && isRowIndexCol) return '';
          if (isHeaderRow) return getColumnLabel(columnIndex - 1);
          if (isRowIndexCol) return rowIndex.toLocaleString();

          const key = getCellKey(rowIndex, columnIndex);
          const value = store.get(key);
          return typeof value !== 'undefined' ? value : key;
        };
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }

  private buildGetCellRectBox() {
    return combineLatest([
      this.itemBoundaryManager.getColumnPrecedingBoundary$,
      this.itemBoundaryManager.getRowPrecedingBoundary$,
    ]).pipe(
      withLatestFrom(this.columnDimensionManager.getDimension$, this.rowDimensionManager.getDimension$),
      map(([[getColumnLeft, getRowTop], getColumnWidth, getRowHeight]) => {
        /**
         * Get the rectangle box of the specified cell.
         *
         * @param rowIndex - The row index, starting from 0.
         * @param columnIndex - The column index, starting from 0.
         */
        return function getCellRectBox(rowIndex: number, columnIndex: number): IRectBox {
          return {
            x: getColumnLeft(columnIndex),
            y: getRowTop(rowIndex),
            width: getColumnWidth(columnIndex),
            height: getRowHeight(rowIndex),
          };
        };
      }),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }
}
