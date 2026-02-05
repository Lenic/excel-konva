import type { ICellRange } from '../core';
import type { IDataManager, TCellChangePatch, TCellContent } from './types';
import type { Observable } from 'rxjs';

import { Subject } from 'rxjs';

import { ObservableDisposable } from '../core';

/**
 * Spreadsheet data manager
 */
export class DataManager extends ObservableDisposable implements IDataManager {
  private store: Map<number, Map<number, TCellContent<any>>>;
  private patchSubject: Subject<TCellChangePatch<any>>;

  patch$: Observable<TCellChangePatch<any>>;

  /**
   * Initializes a new instance of the DataManager class.
   */
  constructor() {
    super();

    this.store = new Map<number, Map<number, TCellContent<any>>>();
    this.disposeWithMe(() => {
      this.store.clear();
    });

    this.patchSubject = new Subject<TCellChangePatch<any>>();
    this.disposeWithMe(() => {
      this.patchSubject.complete();
    });
    this.patch$ = this.patchSubject.asObservable();
  }

  get<T = unknown>(rowIndex: number, columnIndex: number): TCellContent<T> | undefined {
    this.checkDisposed();

    const row = this.store.get(rowIndex);
    if (!row) return;

    return row.get(columnIndex);
  }

  set<T = unknown>(rowIndex: number, columnIndex: number, value?: TCellContent<T>): void {
    this.checkDisposed();

    const range: ICellRange = {
      rowStartIndex: rowIndex,
      rowEndIndex: rowIndex,
      columnStartIndex: columnIndex,
      columnEndIndex: columnIndex,
    };

    if (value === undefined || value === null) {
      const row = this.store.get(rowIndex);
      if (row) {
        row.delete(columnIndex);
        if (row.size === 0) {
          this.store.delete(rowIndex);
        }
      }
      this.patchSubject.next({ type: 'clear', range });
    } else {
      let row = this.store.get(rowIndex);
      if (!row) {
        row = new Map<number, TCellContent<any>>();
        this.store.set(rowIndex, row);
      }
      row.set(columnIndex, value);
      this.patchSubject.next({ type: 'set', range, values: [[value]] });
    }
  }

  setCells<T = unknown>(range: ICellRange, values?: TCellContent<T>[][]): void {
    this.checkDisposed();

    if (!values) {
      for (let r = range.rowStartIndex; r <= range.rowEndIndex; r++) {
        const row = this.store.get(r);
        if (!row) continue;

        for (let c = range.columnStartIndex; c <= range.columnEndIndex; c++) {
          row.delete(c);
        }

        if (row.size === 0) {
          this.store.delete(r);
        }
      }

      this.patchSubject.next({ type: 'clear', range });
    } else {
      for (let r = 0; r < values.length; r++) {
        const rowIndex = range.rowStartIndex + r;
        if (rowIndex > range.rowEndIndex) break;

        let row = this.store.get(rowIndex);
        if (!row) {
          row = new Map<number, TCellContent<any>>();
          this.store.set(rowIndex, row);
        }

        for (let c = 0; c < values[r].length; c++) {
          const columnIndex = range.columnStartIndex + c;
          if (columnIndex > range.columnEndIndex) break;

          const value = values[r][c];
          if (value === null) {
            row.delete(columnIndex);
          } else {
            row.set(columnIndex, value);
          }
        }

        if (row.size === 0) {
          this.store.delete(rowIndex);
        }
      }

      this.patchSubject.next({ type: 'set', range, values });
    }
  }
}
