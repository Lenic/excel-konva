import type { Observable } from 'rxjs';
import type { ISheet } from './types';

import { BehaviorSubject } from 'rxjs';
import { Disposable } from '../core';

/**
 * Sheet
 */
export class Sheet extends Disposable implements ISheet {
  private headerHeightSubject: BehaviorSubject<number>;
  private headerWidthSubject: BehaviorSubject<number>;
  private rowHeightSubject: BehaviorSubject<number>;
  private columnWidthSubject: BehaviorSubject<number>;
  private rowCountSubject: BehaviorSubject<number>;
  private columnCountSubject: BehaviorSubject<number>;
  private frozenColumnsSubject: BehaviorSubject<number>;
  private frozenRowsSubject: BehaviorSubject<number>;

  headerHeight: number;
  headerWidth: number;
  rowHeight: number;
  columnWidth: number;
  rowCount: number;
  columnCount: number;
  frozenColumns: number;
  frozenRows: number;

  headerHeight$: Observable<number>;
  headerWidth$: Observable<number>;
  rowHeight$: Observable<number>;
  columnWidth$: Observable<number>;
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

    headerHeight: number = 30,
    headerWidth: number = 40,
    rowHeight: number = 28,
    columnWidth: number = 100,
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

    this.headerHeightSubject = new BehaviorSubject(headerHeight);
    this.disposeWithMe(() => this.headerHeightSubject.complete());

    this.headerWidthSubject = new BehaviorSubject(headerWidth);
    this.disposeWithMe(() => this.headerWidthSubject.complete());

    this.rowHeightSubject = new BehaviorSubject(rowHeight);
    this.disposeWithMe(() => this.rowHeightSubject.complete());

    this.columnWidthSubject = new BehaviorSubject(columnWidth);
    this.disposeWithMe(() => this.columnWidthSubject.complete());

    this.rowCountSubject = new BehaviorSubject(rowCount);
    this.disposeWithMe(() => this.rowCountSubject.complete());

    this.columnCountSubject = new BehaviorSubject(columnCount);
    this.disposeWithMe(() => this.columnCountSubject.complete());

    this.frozenColumnsSubject = new BehaviorSubject(frozenColumns);
    this.disposeWithMe(() => this.frozenColumnsSubject.complete());

    this.frozenRowsSubject = new BehaviorSubject(frozenRows);
    this.disposeWithMe(() => this.frozenRowsSubject.complete());

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

    this.columnWidth$ = this.columnWidthSubject.asObservable();
    this.disposeWithMe(
      this.columnWidth$.subscribe((width) => {
        this.columnWidth = width;
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
}
