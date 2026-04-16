import type { ICellRange } from '../core';
import type { IAccumulatedDimensionManager } from '../data';
import type { ICellBoxManager, IRectBox } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, filter, map, startWith } from 'rxjs';

import { ObservableDisposable } from '../utils';

export class CellBoxManager extends ObservableDisposable implements ICellBoxManager {
  private rowA: IAccumulatedDimensionManager;
  private columnA: IAccumulatedDimensionManager;

  constructor(rowA: IAccumulatedDimensionManager, columnA: IAccumulatedDimensionManager) {
    super();

    this.rowA = rowA;
    this.columnA = columnA;
  }

  getAbsoluteBox$(range: ICellRange): Observable<IRectBox>;
  getAbsoluteBox$(rowIndex: number, columnIndex: number): Observable<IRectBox>;
  getAbsoluteBox$(...args: any[]): Observable<IRectBox> {
    this.checkDisposed();

    let range: ICellRange | null = null;
    if (args.length === 2) {
      const rowIndex = args[0] as number;
      const columnIndex = args[1] as number;

      range = {
        rowStartIndex: rowIndex,
        columnStartIndex: columnIndex,
        rowEndIndex: rowIndex,
        columnEndIndex: columnIndex,
      };
    } else {
      range = args[0] as ICellRange;
    }

    const leftTopX$ = this.getCoordinateBeginValue$(this.columnA, range.columnStartIndex);
    const leftTopY$ = this.getCoordinateBeginValue$(this.rowA, range.rowStartIndex);
    const rightBottomX$ = this.getCoordinateBeginValue$(this.columnA, range.columnEndIndex + 1);
    const rightBottomY$ = this.getCoordinateBeginValue$(this.rowA, range.rowEndIndex + 1);

    return combineLatest([leftTopX$, leftTopY$, rightBottomX$, rightBottomY$]).pipe(
      map(([leftTopX, leftTopY, rightBottomX, rightBottomY]) => ({
        x: leftTopX,
        y: leftTopY,
        width: rightBottomX - leftTopX,
        height: rightBottomY - leftTopY,
      })),
      this.withPublish(),
    );
  }

  private getCoordinateBeginValue$(manager: IAccumulatedDimensionManager, index: number): Observable<number> {
    return manager.change$.pipe(
      filter((v) => v.type === 'options' || (v.type === 'dimension' && v.current < index)),
      map(() => manager.get(index)),
      startWith(manager.get(index)),
    );
  }
}
