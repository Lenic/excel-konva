import type { ISheetConfig, ISheetOptions } from './types';
import type { Observable } from 'rxjs';

import { BehaviorSubject } from 'rxjs';

import { ObservableDisposable } from '../core';
import type Konva from 'konva';

export const defaultSheetConfig: Required<ISheetOptions> = {
  headerHeight: 30,
  headerWidth: 40,
  rowHeight: 28,
  minRowHeight: 15,
  columnWidth: 100,
  minColumnWidth: 20,
  rowCount: 20,
  columnCount: 8,
  frozenColumns: 1,
  frozenRows: 1,
  resizeLineColor: '#4e95ff',
  selectionRectAttrs: {
    fill: 'rgba(78, 149, 255, 0.15)',
    stroke: '#4e95ff',
    strokeWidth: 2,
  },
  activeCellRectAttrs: {
    fill: 'rgba(255, 255, 255, 0.7)',
    stroke: '#10B981',
    strokeWidth: 3,
  },
  defaultCellRectAttrs: {
    fill: '#ffffff',
    stroke: '#e8e8e8',
    strokeWidth: 0.5,
  },
  defaultCellTextAttrs: {
    fontSize: 12,
    fontFamily: 'Inter, Arial, sans-serif',
    fill: '#333333',
    verticalAlign: 'middle',
    padding: 8,
    listening: false,
    align: 'left',
    ellipsis: true,
    wrap: 'none',
  },
};

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
  private resizeLineColorSubject: BehaviorSubject<string>;
  private selectionRectAttrsSubject: BehaviorSubject<Partial<Konva.RectConfig>>;
  private activeCellRectAttrsSubject: BehaviorSubject<Partial<Konva.RectConfig>>;
  private defaultCellRectAttrsSubject: BehaviorSubject<Partial<Konva.RectConfig>>;
  private defaultCellTextAttrsSubject: BehaviorSubject<Partial<Konva.TextConfig>>;

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
  resizeLineColor: string;
  selectionRectAttrs: Partial<Konva.RectConfig>;
  activeCellRectAttrs: Partial<Konva.RectConfig>;
  defaultCellRectAttrs: Partial<Konva.RectConfig>;
  defaultCellTextAttrs: Partial<Konva.TextConfig>;

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
  resizeLineColor$: Observable<string>;
  selectionRectAttrs$: Observable<Partial<Konva.RectConfig>>;
  activeCellRectAttrs$: Observable<Partial<Konva.RectConfig>>;
  defaultCellRectAttrs$: Observable<Partial<Konva.RectConfig>>;
  defaultCellTextAttrs$: Observable<Partial<Konva.TextConfig>>;

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
   * @param resizeLineColor - Resize line color
   */
  constructor(options: ISheetOptions = {}) {
    super();

    const config: Required<ISheetOptions> = {
      ...defaultSheetConfig,
      ...options,
      selectionRectAttrs: { ...defaultSheetConfig.selectionRectAttrs, ...options.selectionRectAttrs },
      activeCellRectAttrs: { ...defaultSheetConfig.activeCellRectAttrs, ...options.activeCellRectAttrs },
      defaultCellRectAttrs: { ...defaultSheetConfig.defaultCellRectAttrs, ...options.defaultCellRectAttrs },
      defaultCellTextAttrs: { ...defaultSheetConfig.defaultCellTextAttrs, ...options.defaultCellTextAttrs },
    };

    this.headerHeight = config.headerHeight;
    this.headerWidth = config.headerWidth;
    this.frozenColumns = config.frozenColumns;
    this.frozenRows = config.frozenRows;
    this.rowHeight = config.rowHeight;
    this.columnWidth = config.columnWidth;
    this.rowCount = config.rowCount;
    this.columnCount = config.columnCount;
    this.minRowHeight = config.minRowHeight;
    this.minColumnWidth = config.minColumnWidth;
    this.resizeLineColor = config.resizeLineColor;
    this.selectionRectAttrs = config.selectionRectAttrs;
    this.activeCellRectAttrs = config.activeCellRectAttrs;
    this.defaultCellRectAttrs = config.defaultCellRectAttrs;
    this.defaultCellTextAttrs = config.defaultCellTextAttrs;

    this.headerHeightSubject = new BehaviorSubject(config.headerHeight);
    this.disposeWithMe(() => {
      this.headerHeightSubject.complete();
    });

    this.headerWidthSubject = new BehaviorSubject(config.headerWidth);
    this.disposeWithMe(() => {
      this.headerWidthSubject.complete();
    });

    this.rowHeightSubject = new BehaviorSubject(config.rowHeight);
    this.disposeWithMe(() => {
      this.rowHeightSubject.complete();
    });

    this.minRowHeightSubject = new BehaviorSubject(config.minRowHeight);
    this.disposeWithMe(() => {
      this.minRowHeightSubject.complete();
    });

    this.columnWidthSubject = new BehaviorSubject(config.columnWidth);
    this.disposeWithMe(() => {
      this.columnWidthSubject.complete();
    });

    this.minColumnWidthSubject = new BehaviorSubject(config.minColumnWidth);
    this.disposeWithMe(() => {
      this.minColumnWidthSubject.complete();
    });

    this.rowCountSubject = new BehaviorSubject(config.rowCount);
    this.disposeWithMe(() => {
      this.rowCountSubject.complete();
    });

    this.columnCountSubject = new BehaviorSubject(config.columnCount);
    this.disposeWithMe(() => {
      this.columnCountSubject.complete();
    });

    this.frozenColumnsSubject = new BehaviorSubject(config.frozenColumns);
    this.disposeWithMe(() => {
      this.frozenColumnsSubject.complete();
    });

    this.frozenRowsSubject = new BehaviorSubject(config.frozenRows);
    this.disposeWithMe(() => {
      this.frozenRowsSubject.complete();
    });

    this.resizeLineColorSubject = new BehaviorSubject(config.resizeLineColor);
    this.disposeWithMe(() => {
      this.resizeLineColorSubject.complete();
    });

    this.selectionRectAttrsSubject = new BehaviorSubject(config.selectionRectAttrs);
    this.disposeWithMe(() => {
      this.selectionRectAttrsSubject.complete();
    });

    this.activeCellRectAttrsSubject = new BehaviorSubject(config.activeCellRectAttrs);
    this.disposeWithMe(() => {
      this.activeCellRectAttrsSubject.complete();
    });

    this.defaultCellRectAttrsSubject = new BehaviorSubject(config.defaultCellRectAttrs);
    this.disposeWithMe(() => {
      this.defaultCellRectAttrsSubject.complete();
    });

    this.defaultCellTextAttrsSubject = new BehaviorSubject(config.defaultCellTextAttrs);
    this.disposeWithMe(() => {
      this.defaultCellTextAttrsSubject.complete();
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

    this.resizeLineColor$ = this.resizeLineColorSubject.asObservable();
    this.disposeWithMe(
      this.resizeLineColor$.subscribe((color) => {
        this.resizeLineColor = color;
      }),
    );

    this.selectionRectAttrs$ = this.selectionRectAttrsSubject.asObservable();
    this.disposeWithMe(
      this.selectionRectAttrs$.subscribe((attrs) => {
        this.selectionRectAttrs = attrs;
      }),
    );

    this.activeCellRectAttrs$ = this.activeCellRectAttrsSubject.asObservable();
    this.disposeWithMe(
      this.activeCellRectAttrs$.subscribe((attrs) => {
        this.activeCellRectAttrs = attrs;
      }),
    );

    this.defaultCellRectAttrs$ = this.defaultCellRectAttrsSubject.asObservable();
    this.disposeWithMe(
      this.defaultCellRectAttrs$.subscribe((attrs) => {
        this.defaultCellRectAttrs = attrs;
      }),
    );

    this.defaultCellTextAttrs$ = this.defaultCellTextAttrsSubject.asObservable();
    this.disposeWithMe(
      this.defaultCellTextAttrs$.subscribe((attrs) => {
        this.defaultCellTextAttrs = attrs;
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

  setResizeLineColor(color: string): void {
    this.resizeLineColorSubject.next(color);
  }

  setSelectionRectAttrs(attrs: Partial<Konva.RectConfig>): void {
    this.selectionRectAttrsSubject.next(attrs);
  }

  setActiveCellRectAttrs(attrs: Partial<Konva.RectConfig>): void {
    this.activeCellRectAttrsSubject.next(attrs);
  }

  setDefaultCellRectAttrs(attrs: Partial<Konva.RectConfig>): void {
    this.defaultCellRectAttrsSubject.next(attrs);
  }

  setDefaultCellTextAttrs(attrs: Partial<Konva.TextConfig>): void {
    this.defaultCellTextAttrsSubject.next(attrs);
  }
}
