import type { ICellRange } from '../core';
import type { IDataManager, IDataProvider, TCellChangePatch, TCellContent } from './types';
import type { Observable } from 'rxjs';

import { Subject } from 'rxjs';

import { getDefaultValue, ObservableDisposable } from '../utils';

/**
 * Spreadsheet data manager
 */
export class DataManager extends ObservableDisposable implements IDataManager {
  private provider: IDataProvider;
  private patchSubject: Subject<TCellChangePatch<any>>;

  change$: Observable<TCellChangePatch<any>>;

  /**
   * Initializes a new instance of the DataManager class.
   */
  constructor(provider: IDataProvider) {
    super();

    this.provider = provider;
    this.disposeWithMe(() => void (this.provider = getDefaultValue<IDataProvider>()));

    this.patchSubject = new Subject<TCellChangePatch<any>>();
    this.disposeWithMe(() => {
      this.patchSubject.complete();
    });
    this.change$ = this.patchSubject.asObservable();
  }

  get<T = unknown>(rowIndex: number, columnIndex: number): TCellContent<T> {
    this.checkDisposed();

    return this.provider.get(rowIndex, columnIndex);
  }

  set<T = unknown>(rowIndex: number, columnIndex: number, value: TCellContent<T> | TCellContent<T>[][]): void {
    this.checkDisposed();

    const range: ICellRange = {
      rowStartIndex: rowIndex,
      rowEndIndex: rowIndex,
      columnStartIndex: columnIndex,
      columnEndIndex: columnIndex,
    };

    let patch: TCellChangePatch<T>;
    if (value === null) {
      patch = { type: 'clear', range };
    } else {
      patch = { type: 'set', range, values: Array.isArray(value) ? value : [[value]] };
    }

    this.provider.set(patch);
    this.patchSubject.next(patch);
  }

  clear(range: ICellRange): void {
    this.checkDisposed();

    const patch: TCellChangePatch<any> = { type: 'clear', range };
    this.provider.set(patch);
    this.patchSubject.next(patch);
  }
}
