import type { ILocation, IPoint, IRectBox } from '../types';
import type { ICellDimension, IItemBoundary } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, combineLatestWith, map, scan, shareReplay, startWith, Subject, switchMap, take } from 'rxjs';

import { binarySearch, Disposable, getCellKey, getColumnLabel } from '../core';
import { container } from '../core-elements';

import { scrollOffset, sheet } from '.';

/**
 * Cell dimension
 */
export class CellDimension extends Disposable implements ICellDimension {
  private cellDataSubject: Subject<[string, string | null]>;

  boundary: IItemBoundary;

  cellDataStore: Map<string, string>;

  getCellData$: Observable<(rowIndex: number, columnIndex: number) => string>;
  getCellRectBox$: Observable<(rowIndex: number, columnIndex: number) => IRectBox>;
  getCellLocation$: Observable<(rowIndex: number, columnIndex: number) => ILocation>;
  getCellPoint$: Observable<(rowIndex: number, columnIndex: number) => IPoint>;

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
      this.boundary.getColumnLeft$.pipe(
        switchMap((getColumnLeft) =>
          this.boundary.column.dimension.get$.pipe(
            take(1),
            map((getColumnWidth) => [getColumnLeft, getColumnWidth] as const),
          ),
        ),
      ),
      this.boundary.getRowTop$.pipe(
        switchMap((getRowTop) =>
          this.boundary.row.dimension.get$.pipe(
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
    const getColumnIndex$ = this.buildGetItemIndex(
      this.boundary.column.get$,
      sheet.frozenColumns$,
      sheet.columnCount$,
      scrollOffset.left$,
    );
    const getRowIndex$ = this.buildGetItemIndex(
      this.boundary.row.get$,
      sheet.frozenRows$,
      sheet.rowCount$,
      scrollOffset.top$,
    );
    return combineLatest([getColumnIndex$, getRowIndex$]).pipe(
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
            rowIndex: getRowIndex(clientX - rect.left),
            columnIndex: getColumnIndex(clientY - rect.top),
          };
        };
      }),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }

  private buildGetItemIndex(
    getAccumulatedDimension$: Observable<(index: number) => number>,
    frozenCount$: Observable<number>,
    count$: Observable<number>,
    scrollValue$: Observable<number>,
  ) {
    return getAccumulatedDimension$.pipe(
      switchMap((getAccumulatedDimension) => {
        const getItemIndexByPosition$ = count$.pipe(
          map((count) => {
            // beginValue endValue
            const list: [number, number][] = [];
            let maxIndex = -1;

            return function getItemIndexByPosition(position: number) {
              const index = binarySearch(0, list.length - 1, (mid) => {
                const [beginValue, endValue] = list[mid];
                if (beginValue <= position && position < endValue) return 0;
                return beginValue > position ? 1 : -1;
              });
              if (index !== -1) return index;

              let resultIndex = -1;
              for (let i = maxIndex + 1; i < count; i++) {
                const beginValue = getAccumulatedDimension(i);
                const endValue = getAccumulatedDimension(i + 1);

                maxIndex = i;
                list.push([beginValue, endValue]);

                if (position < endValue) {
                  resultIndex = i;
                  break;
                }
              }
              return Math.max(0, Math.min(resultIndex, count - 1));
            };
          }),
        );

        const frozenDimension$ = frozenCount$.pipe(map((frozenCount) => getAccumulatedDimension(frozenCount)));

        return combineLatest([getItemIndexByPosition$, frozenDimension$]);
      }),
      combineLatestWith(scrollValue$),
      map(([[getItemIndexByPosition, frozenDimension], scrollValue]) => {
        return function getItemIndex(position: number) {
          return position <= frozenDimension
            ? getItemIndexByPosition(position)
            : getItemIndexByPosition(position + scrollValue);
        };
      }),
    );
  }

  private buildGetCellPoint() {
    return combineLatest([this.boundary.column.get$, this.boundary.row.get$]).pipe(
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
