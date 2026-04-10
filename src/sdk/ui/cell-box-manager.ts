import type { IObservableValue, IOffset, IScrollOffset } from '../core';
import type { IAccumulatedDimensionManager, IDimensionManager } from '../data';
import type { ICellBoxManager, IFrozenInformation, IRectBox } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, distinctUntilChanged, filter, map, of, startWith, switchMap } from 'rxjs';

import { ObservableDisposable } from '../utils';

export class CellBoxManager extends ObservableDisposable implements ICellBoxManager {
  private row: IDimensionManager;
  private column: IDimensionManager;
  private rowA: IAccumulatedDimensionManager;
  private columnA: IAccumulatedDimensionManager;
  private offset$: Observable<IOffset>;
  private frozenInfo: IObservableValue<IFrozenInformation>;

  constructor(
    row: IDimensionManager,
    column: IDimensionManager,
    rowA: IAccumulatedDimensionManager,
    columnA: IAccumulatedDimensionManager,
    scroller: IScrollOffset,
    frozenInfo: IObservableValue<IFrozenInformation>,
  ) {
    super();

    this.row = row;
    this.column = column;
    this.rowA = rowA;
    this.columnA = columnA;
    this.frozenInfo = frozenInfo;

    this.offset$ = scroller.change$.pipe(
      map(() => scroller.offset),
      startWith(scroller.offset),
      this.withPublish(),
    );
  }

  getAbsoluteBox$(rowIndex: number, columnIndex: number): Observable<IRectBox> {
    this.checkDisposed();

    const width$ = this.column.change$.pipe(
      filter((v) => v.type === 'options' || v.index === columnIndex),
      map(() => this.column.get(columnIndex)),
      startWith(this.column.get(columnIndex)),
    );

    const height$ = this.row.change$.pipe(
      filter((v) => v.type === 'options' || v.index === rowIndex),
      map(() => this.row.get(rowIndex)),
      startWith(this.row.get(rowIndex)),
    );

    const x$ = this.columnA.change$.pipe(
      filter((v) => v.type === 'options' || (v.type === 'dimension' && v.current < columnIndex)),
      map(() => this.columnA.get(columnIndex)),
      startWith(this.columnA.get(columnIndex)),
    );

    const y$ = this.rowA.change$.pipe(
      filter((v) => v.type === 'options' || (v.type === 'dimension' && v.current < rowIndex)),
      map(() => this.rowA.get(rowIndex)),
      startWith(this.rowA.get(rowIndex)),
    );

    return combineLatest([x$, y$, width$, height$]).pipe(
      map(([x, y, width, height]) => ({ x, y, width, height })),
      this.withPublish(),
    );
  }

  getRelativeBox$(rowIndex: number, columnIndex: number): Observable<IRectBox> {
    const box$ = this.getAbsoluteBox$(rowIndex, columnIndex);

    const currentOffset$ = this.frozenInfo.value$.pipe(
      switchMap(({ rowCount, columnCount }) => {
        const deltaY$ =
          rowIndex < rowCount
            ? of(0)
            : this.offset$.pipe(
                map((v) => v.deltaY),
                distinctUntilChanged(),
              );
        const deltaX$ =
          columnIndex < columnCount
            ? of(0)
            : this.offset$.pipe(
                map((v) => v.deltaX),
                distinctUntilChanged(),
              );
        return combineLatest([deltaY$, deltaX$]).pipe(map(([deltaY, deltaX]): IOffset => ({ deltaX, deltaY })));
      }),
      distinctUntilChanged((a, b) => a.deltaX === b.deltaX && a.deltaY === b.deltaY),
    );

    return combineLatest([box$, currentOffset$]).pipe(
      map(([box, offset]) => ({
        x: box.x - offset.deltaX,
        y: box.y - offset.deltaY,
        width: box.width,
        height: box.height,
      })),
      this.withPublish(),
    );
  }
}
