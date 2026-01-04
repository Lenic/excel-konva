import type { ILocation, IPoint, IRectBox } from '../types';
import type { ICellDimension, IItemBoundary } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, map, scan, shareReplay, startWith, Subject, switchMap, take } from 'rxjs';

import { getCellKey, getColumnLabel, ObservableDisposable } from '../core';
import { container } from '../core-elements';

/**
 * Cell dimension
 */
export class CellDimension extends ObservableDisposable implements ICellDimension {
  private cellDataSubject: Subject<[string, string | null]>;

  columnBoundary: IItemBoundary;
  rowBoundary: IItemBoundary;

  cellDataStore: Map<string, string>;

  getCellData$: Observable<(rowIndex: number, columnIndex: number) => string>;
  getCellRectBox$: Observable<(rowIndex: number, columnIndex: number) => IRectBox>;
  getCellLocation$: Observable<(clientX: number, clientY: number) => ILocation>;
  getCellPoint$: Observable<(rowIndex: number, columnIndex: number) => IPoint>;

  /**
   * Constructor
   *
   * @param columnBoundary - Column boundary manager
   * @param rowBoundary - Row boundary manager
   */
  constructor(columnBoundary: IItemBoundary, rowBoundary: IItemBoundary) {
    super();

    this.columnBoundary = columnBoundary;
    this.rowBoundary = rowBoundary;

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

    this.getCellLocation$ = this.buildGetCellLocation();
    this.disposeWithMe(this.getCellLocation$.subscribe());

    this.getCellPoint$ = this.buildGetCellPoint();
    this.disposeWithMe(this.getCellPoint$.subscribe());
  }

  setCellData(key: string, value: string | null): void;
  setCellData(rowIndex: number, columnIndex: number, value: string | null): void;
  setCellData(...args: any[]) {
    if (args.length === 2) {
      this.cellDataSubject.next(args as [string, string | null]);
    } else if (args.length === 3) {
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
      this.columnBoundary.getBoundary$.pipe(
        switchMap((getColumnLeft) =>
          this.columnBoundary.accumulated.dimension.get$.pipe(
            take(1),
            map((getColumnWidth) => [getColumnLeft, getColumnWidth] as const),
          ),
        ),
      ),
      this.rowBoundary.getBoundary$.pipe(
        switchMap((getRowTop) =>
          this.rowBoundary.accumulated.dimension.get$.pipe(
            take(1),
            map((getRowHeight) => [getRowTop, getRowHeight] as const),
          ),
        ),
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

  private buildGetCellLocation() {
    return combineLatest([this.columnBoundary.getItemIndex$, this.rowBoundary.getItemIndex$]).pipe(
      map(([getColumnIndex, getRowIndex]) => {
        /**
         * Get the location of the specified cell.
         *
         * @param clientX - The X coordinate of the mouse relative to the viewport.
         * @param clientY - The Y coordinate of the mouse relative to the viewport.
         */
        return function getCellLocation(clientX: number, clientY: number): ILocation {
          const rect = container.getBoundingClientRect();
          return {
            rowIndex: getRowIndex(clientY - rect.top),
            columnIndex: getColumnIndex(clientX - rect.left),
          };
        };
      }),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }

  private buildGetCellPoint() {
    return combineLatest([this.columnBoundary.getBoundary$, this.rowBoundary.getBoundary$]).pipe(
      map(([getColumnLeft, getRowTop]) => {
        /**
         * Get the cell point of the specified cell.
         *
         * @param rowIndex - The row index, starting from 0.
         * @param columnIndex - The column index, starting from 0.
         */
        return function getCellPoint(rowIndex: number, columnIndex: number): IPoint {
          return {
            x: getColumnLeft(columnIndex),
            y: getRowTop(rowIndex),
          };
        };
      }),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }
}
