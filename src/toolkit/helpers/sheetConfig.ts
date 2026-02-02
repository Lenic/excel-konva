import type { ISheetConfig, ISheetOptions } from './types';
import type { Observable } from 'rxjs';

import { BehaviorSubject, distinctUntilChanged, finalize, map } from 'rxjs';

import { ObservableDisposable } from '../core';

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
    fill: 'rgba(0, 0, 0, 0)',
    stroke: '#10B981',
    strokeWidth: 2,
  },
  defaultCellRectAttrs: {
    fill: '#ffffff',
    stroke: '#e8e8e8',
    strokeWidth: 0.5,
  },
  defaultOddCellRectAttrs: {},
  defaultEvenCellRectAttrs: {
    fill: '#f9f9f9',
  },
  frozenCellRectAttrs: {
    stroke: '#cccccc',
    strokeWidth: 1,
  },
  frozenOddCellRectAttrs: {},
  frozenEvenCellRectAttrs: {},
  headerCellRectAttrs: {
    fill: '#f0f0f0',
  },
  columnHeaderCellRectAttrs: {},
  rowHeaderCellRectAttrs: {},
  cornerCellRectAttrs: {
    fill: '#e0e0e0',
  },
  defaultCellTextAttrs: {
    fontSize: 12,
    fontFamily: 'Inter, Arial, sans-serif',
    fill: '#333333',
    verticalAlign: 'middle',
    padding: 8,
    align: 'left',
    ellipsis: true,
    wrap: 'none',
    listening: false,
  },
  defaultOddCellTextAttrs: {},
  defaultEvenCellTextAttrs: {},
  frozenCellTextAttrs: {},
  frozenOddCellTextAttrs: {},
  frozenEvenCellTextAttrs: {},
  headerCellTextAttrs: {
    fontSize: 14,
    fill: '#000000',
    align: 'center',
  },
  columnHeaderCellTextAttrs: {},
  rowHeaderCellTextAttrs: {
    padding: 0,
  },
  resizeTolerance: 5,
};

/**
 * Sheet Config
 */
export class SheetConfig extends ObservableDisposable implements ISheetConfig {
  private optionsSubject: BehaviorSubject<Required<ISheetOptions>>;
  private getterMap: Map<keyof Required<ISheetOptions>, Observable<any>>;

  options: Required<ISheetOptions>;

  options$: Observable<Required<ISheetOptions>>;

  /**
   * Constructor
   *
   * @param options - Sheet options
   */
  constructor(options: ISheetOptions) {
    super();

    this.options = {
      ...defaultSheetConfig,
      ...options,
      selectionRectAttrs: { ...defaultSheetConfig.selectionRectAttrs, ...options.selectionRectAttrs },
      activeCellRectAttrs: { ...defaultSheetConfig.activeCellRectAttrs, ...options.activeCellRectAttrs },
      defaultCellRectAttrs: { ...defaultSheetConfig.defaultCellRectAttrs, ...options.defaultCellRectAttrs },
      frozenCellRectAttrs: { ...defaultSheetConfig.frozenCellRectAttrs, ...options.frozenCellRectAttrs },
      frozenOddCellRectAttrs: { ...defaultSheetConfig.frozenOddCellRectAttrs, ...options.frozenOddCellRectAttrs },
      frozenEvenCellRectAttrs: {
        ...defaultSheetConfig.frozenEvenCellRectAttrs,
        ...options.frozenEvenCellRectAttrs,
      },
      headerCellRectAttrs: { ...defaultSheetConfig.headerCellRectAttrs, ...options.headerCellRectAttrs },
      columnHeaderCellRectAttrs: {
        ...defaultSheetConfig.columnHeaderCellRectAttrs,
        ...options.columnHeaderCellRectAttrs,
      },
      rowHeaderCellRectAttrs: { ...defaultSheetConfig.rowHeaderCellRectAttrs, ...options.rowHeaderCellRectAttrs },
      defaultCellTextAttrs: { ...defaultSheetConfig.defaultCellTextAttrs, ...options.defaultCellTextAttrs },
      headerCellTextAttrs: { ...defaultSheetConfig.headerCellTextAttrs, ...options.headerCellTextAttrs },
      columnHeaderCellTextAttrs: {
        ...defaultSheetConfig.columnHeaderCellTextAttrs,
        ...options.columnHeaderCellTextAttrs,
      },
      rowHeaderCellTextAttrs: { ...defaultSheetConfig.rowHeaderCellTextAttrs, ...options.rowHeaderCellTextAttrs },
    };

    this.optionsSubject = new BehaviorSubject(this.options);
    this.disposeWithMe(() => {
      this.optionsSubject.complete();
    });

    this.getterMap = new Map<keyof Required<ISheetOptions>, Observable<any>>();
    this.disposeWithMe(() => {
      this.getterMap.clear();
    });

    this.options$ = this.optionsSubject.asObservable();
    this.disposeWithMe(
      this.options$.subscribe((options) => {
        this.options = options;
      }),
    );
  }

  get$<K extends keyof Required<ISheetOptions>>(key: K): Observable<Required<ISheetOptions>[K]> {
    let obs$ = this.getterMap.get(key) as Observable<Required<ISheetOptions>[K]> | undefined;
    if (!obs$) {
      obs$ = this.options$.pipe(
        map((options) => options[key]),
        distinctUntilChanged(),
        finalize(() => void this.getterMap.delete(key)),
        this.withPublish(),
      );
      this.getterMap.set(key, obs$);
    }
    return obs$;
  }

  set(options: Partial<ISheetOptions> | ((options: Required<ISheetOptions>) => Required<ISheetOptions>)): void {
    this.optionsSubject.next(typeof options === 'function' ? options(this.options) : { ...this.options, ...options });
  }
}
