import type { ICellRange } from '../core';
import type { IAccumulatedDimensionManager, IDimensionManager } from '../data';
import type { ICellBoxManager, IRectBox, TCellBoxChangePatch } from './types';

import { type Observable, Subject } from 'rxjs';

import { ObservableDisposable } from '../utils';

export class CellBoxManager extends ObservableDisposable implements ICellBoxManager {
  private row: IDimensionManager;
  private column: IDimensionManager;
  private rowA: IAccumulatedDimensionManager;
  private columnA: IAccumulatedDimensionManager;
  private changeSubject: Subject<TCellBoxChangePatch>;

  change$: Observable<TCellBoxChangePatch>;

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

    this.changeSubject = new Subject<TCellBoxChangePatch>();
    this.disposeWithMe(() => {
      this.changeSubject.complete();
    });
    this.change$ = this.changeSubject.asObservable();

    this.disposeWithMe(
      this.rowA.change$.subscribe((patch) => {
        if (patch.type === 'dimension') {
          this.changeSubject.next({
            type: 'row',
            index: patch.index,
            previous: patch.previous,
            current: patch.current,
          });
        } else {
          this.changeSubject.next({ type: 'reset', property: 'row' });
        }
      }),
    );
    this.disposeWithMe(
      this.columnA.change$.subscribe((patch) => {
        if (patch.type === 'dimension') {
          this.changeSubject.next({
            type: 'column',
            index: patch.index,
            previous: patch.previous,
            current: patch.current,
          });
        } else {
          this.changeSubject.next({ type: 'reset', property: 'column' });
        }
      }),
    );
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
