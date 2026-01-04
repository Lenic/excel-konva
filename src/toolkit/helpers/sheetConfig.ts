import type { ISheetConfig } from './types';
import type { Observable } from 'rxjs';

import { BehaviorSubject } from 'rxjs';

import { ObservableDisposable } from '../core';

/**
 * Sheet Config
 */
export class SheetConfig extends ObservableDisposable implements ISheetConfig {
  private headerHeightSubject: BehaviorSubject<number>;
  private headerWidthSubject: BehaviorSubject<number>;
  private rowHeightSubject: BehaviorSubject<number>;
  private minRowHeightSubject: BehaviorSubject<number>;
  private columnWidthSubject: BehaviorSubject<number>;
  private minColumnWidthSubject: BehaviorSubject<number>;
  private rowCountSubject: BehaviorSubject<number>;
  private columnCountSubject: BehaviorSubject<number>;
  private frozenColumnsSubject: BehaviorSubject<number>;
  private frozenRowsSubject: BehaviorSubject<number>;

  headerHeight: number;
  headerWidth: number;
  rowHeight: number;
  minRowHeight: number;
  columnWidth: number;
  minColumnWidth: number;
  rowCount: number;
  columnCount: number;
  frozenColumns: number;
  frozenRows: number;

  headerHeight$: Observable<number>;
  headerWidth$: Observable<number>;
  rowHeight$: Observable<number>;
  minRowHeight$: Observable<number>;
  columnWidth$: Observable<number>;
  minColumnWidth$: Observable<number>;
  rowCount$: Observable<number>;
  columnCount$: Observable<number>;
  frozenColumns$: Observable<number>;
  frozenRows$: Observable<number>;

  /**
   * Constructor
   *
   * @param rowCount - Row count
   * @param columnCount - Column count
   * @param frozenColumns - Frozen columns
   * @param frozenRows - Frozen rows
   * @param minRowHeight - Min row height
   * @param minColumnWidth - Min column width
   * @param headerHeight - Header height
   * @param headerWidth - Header width
   * @param rowHeight - Row height
   * @param columnWidth - Column width
   */
  constructor(
    rowCount: number,
    columnCount: number,
    frozenColumns: number,
    frozenRows: number,

    minRowHeight = 15,
    minColumnWidth = 20,
    headerHeight = 30,
    headerWidth = 40,
    rowHeight = 28,
    columnWidth = 100,
  ) {
    super();

    this.headerHeight = 0;
    this.headerWidth = 0;
    this.frozenColumns = 0;
    this.frozenRows = 0;
    this.rowHeight = 0;
    this.columnWidth = 0;
    this.rowCount = 0;
    this.columnCount = 0;
    this.minRowHeight = 0;
    this.minColumnWidth = 0;

    this.headerHeightSubject = new BehaviorSubject(headerHeight);
    this.disposeWithMe(() => {
      this.headerHeightSubject.complete();
    });

    this.headerWidthSubject = new BehaviorSubject(headerWidth);
    this.disposeWithMe(() => {
      this.headerWidthSubject.complete();
    });

    this.rowHeightSubject = new BehaviorSubject(rowHeight);
    this.disposeWithMe(() => {
      this.rowHeightSubject.complete();
    });

    this.minRowHeightSubject = new BehaviorSubject(minRowHeight);
    this.disposeWithMe(() => {
      this.minRowHeightSubject.complete();
    });

    this.columnWidthSubject = new BehaviorSubject(columnWidth);
    this.disposeWithMe(() => {
      this.columnWidthSubject.complete();
    });

    this.minColumnWidthSubject = new BehaviorSubject(minColumnWidth);
    this.disposeWithMe(() => {
      this.minColumnWidthSubject.complete();
    });

    this.rowCountSubject = new BehaviorSubject(rowCount);
    this.disposeWithMe(() => {
      this.rowCountSubject.complete();
    });

    this.columnCountSubject = new BehaviorSubject(columnCount);
    this.disposeWithMe(() => {
      this.columnCountSubject.complete();
    });

    this.frozenColumnsSubject = new BehaviorSubject(frozenColumns);
    this.disposeWithMe(() => {
      this.frozenColumnsSubject.complete();
    });

    this.frozenRowsSubject = new BehaviorSubject(frozenRows);
    this.disposeWithMe(() => {
      this.frozenRowsSubject.complete();
    });

    this.headerHeight$ = this.headerHeightSubject.asObservable();
    this.disposeWithMe(
      this.headerHeight$.subscribe((height) => {
        this.headerHeight = height;
      }),
    );

    this.headerWidth$ = this.headerWidthSubject.asObservable();
    this.disposeWithMe(
      this.headerWidth$.subscribe((width) => {
        this.headerWidth = width;
      }),
    );

    this.rowHeight$ = this.rowHeightSubject.asObservable();
    this.disposeWithMe(
      this.rowHeight$.subscribe((height) => {
        this.rowHeight = height;
      }),
    );

    this.minRowHeight$ = this.minRowHeightSubject.asObservable();
    this.disposeWithMe(
      this.minRowHeight$.subscribe((height) => {
        this.minRowHeight = height;
      }),
    );

    this.columnWidth$ = this.columnWidthSubject.asObservable();
    this.disposeWithMe(
      this.columnWidth$.subscribe((width) => {
        this.columnWidth = width;
      }),
    );

    this.minColumnWidth$ = this.minColumnWidthSubject.asObservable();
    this.disposeWithMe(
      this.minColumnWidth$.subscribe((width) => {
        this.minColumnWidth = width;
      }),
    );

    this.rowCount$ = this.rowCountSubject.asObservable();
    this.disposeWithMe(
      this.rowCount$.subscribe((count) => {
        this.rowCount = count;
      }),
    );

    this.columnCount$ = this.columnCountSubject.asObservable();
    this.disposeWithMe(
      this.columnCount$.subscribe((count) => {
        this.columnCount = count;
      }),
    );

    this.frozenColumns$ = this.frozenColumnsSubject.asObservable();
    this.disposeWithMe(
      this.frozenColumns$.subscribe((count) => {
        this.frozenColumns = count;
      }),
    );

    this.frozenRows$ = this.frozenRowsSubject.asObservable();
    this.disposeWithMe(
      this.frozenRows$.subscribe((count) => {
        this.frozenRows = count;
      }),
    );
  }

  setHeaderHeight(height: number): void {
    this.headerHeightSubject.next(height);
  }

  setHeaderWidth(width: number): void {
    this.headerWidthSubject.next(width);
  }

  setRowHeight(height: number): void {
    this.rowHeightSubject.next(height);
  }

  setColumnWidth(width: number): void {
    this.columnWidthSubject.next(width);
  }

  setRowCount(count: number): void {
    this.rowCountSubject.next(count);
  }

  setColumnCount(count: number): void {
    this.columnCountSubject.next(count);
  }

  setFrozenColumns(count: number): void {
    this.frozenColumnsSubject.next(count);
  }

  setFrozenRows(count: number): void {
    this.frozenRowsSubject.next(count);
  }

  setMinRowHeight(height: number): void {
    this.minRowHeightSubject.next(height);
  }

  setMinColumnWidth(width: number): void {
    this.minColumnWidthSubject.next(width);
  }
}
