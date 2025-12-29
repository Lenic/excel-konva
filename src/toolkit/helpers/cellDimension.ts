import type { IRectBox } from '../types';
import type { ICellDimension, IItemBoundary } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, distinctUntilChanged, map, scan, shareReplay, startWith, Subject } from 'rxjs';

import { Disposable, getCellKey, getColumnLabel } from '../core';

/**
 * Cell dimension
 */
export class CellDimension extends Disposable implements ICellDimension {
  private cellDataSubject: Subject<[string, string | null]>;

  boundary: IItemBoundary;

  cellDataStore: Map<string, string>;

  getCellData$: Observable<(rowIndex: number, columnIndex: number) => string>;
  getCellRectBox$: Observable<(rowIndex: number, columnIndex: number) => IRectBox>;

  /**
   * Constructor
   *
   * @param itemBoundary - Item boundary manager
   */
  constructor(itemBoundary: IItemBoundary) {
    super();

    this.boundary = itemBoundary;

    this.cellDataSubject = new Subject<[string, string | null]>();
    this.disposeWithMe(() => {
      this.cellDataSubject.complete();
    });

    this.cellDataStore = new Map<string, string>();
    this.disposeWithMe(() => {
      this.cellDataStore.clear();
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
      }, this.cellDataStore),
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
      combineLatest([this.boundary.getColumnLeft$, this.boundary.column.dimension.get$]).pipe(
        distinctUntilChanged((prev, curr) => prev[0] === curr[0]),
      ),
      combineLatest([this.boundary.getRowTop$, this.boundary.row.dimension.get$]).pipe(
        distinctUntilChanged((prev, curr) => prev[0] === curr[0]),
      ),
    ]).pipe(
      map(([[getColumnLeft, getColumnWidth], [getRowTop, getRowHeight]]) => {
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
