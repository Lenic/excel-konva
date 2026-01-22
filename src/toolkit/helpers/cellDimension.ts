import type { ILocation, IPoint, IRectBox } from '../types';
import type { ICellDimension, IItemBoundary } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, map, scan, startWith, Subject, switchMap, take } from 'rxjs';

import { getCellKey, getColumnLabel, ObservableDisposable } from '../core';

/**
 * Cell dimension
 */
export class CellDimension extends ObservableDisposable implements ICellDimension {
  private cellDataSubject: Subject<[string, unknown]>;

  columnBoundary: IItemBoundary;
  rowBoundary: IItemBoundary;

  cellDataStore: Map<string, unknown>;

  getCellData$: Observable<(rowIndex: number, columnIndex: number) => unknown>;
  getCellRectBox$: Observable<(rowIndex: number, columnIndex: number) => IRectBox>;
  getCellLocation$: Observable<(relX: number, relY: number) => ILocation>;
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

  setCellData(key: string, value?: unknown): void;
  setCellData(rowIndex: number, columnIndex: number, value?: unknown): void;
  setCellData(...args: any[]) {
    if (args.length === 2) {
      this.cellDataSubject.next(args as [string, unknown]);
    } else if (args.length === 3) {
      this.cellDataSubject.next([getCellKey(args[0] as number, args[1] as number), args[2]] as [string, unknown]);
    }
  }

  private buildGetCellData() {
    return this.cellDataSubject.pipe(
      startWith(null),
      scan((acc, item) => {
        if (item === null) return acc;

        const [key, value] = item;
        if (value === undefined) {
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
      this.withPublish(),
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
      this.withPublish(),
    );
  }

  private buildGetCellLocation() {
    return combineLatest([this.columnBoundary.getItemIndex$, this.rowBoundary.getItemIndex$]).pipe(
      map(([getColumnIndex, getRowIndex]) => {
        /**
         * Get the location of the specified cell.
         *
         * @param relX - The X coordinate of the mouse relative to the canvas.
         * @param relY - The Y coordinate of the mouse relative to the canvas.
         */
        return function getCellLocation(relX: number, relY: number): ILocation {
          return {
            rowIndex: getRowIndex(relY),
            columnIndex: getColumnIndex(relX),
          };
        };
      }),
      this.withPublish(),
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
      this.withPublish(),
    );
  }
}
