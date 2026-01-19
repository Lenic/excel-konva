import type { ISheetConfig, ISheetOptions } from './types';
import type { Observable } from 'rxjs';

import { finalize, switchMap } from 'rxjs';
import { BehaviorSubject, distinctUntilChanged, map, shareReplay } from 'rxjs';

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
  private optionsSubject: BehaviorSubject<Required<ISheetOptions>>;
  private getMap: Map<keyof Required<ISheetOptions>, Observable<any>>;

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
      defaultCellTextAttrs: { ...defaultSheetConfig.defaultCellTextAttrs, ...options.defaultCellTextAttrs },
    };

    this.optionsSubject = new BehaviorSubject(this.options);
    this.disposeWithMe(() => {
      this.optionsSubject.complete();
    });

    this.getMap = new Map<keyof Required<ISheetOptions>, Observable<any>>();
    this.disposeWithMe(() => {
      this.getMap.clear();
    });

    this.options$ = this.optionsSubject.asObservable();
    this.disposeWithMe(
      this.options$.subscribe((options) => {
        this.options = options;
      }),
    );
  }

  get$<K extends keyof Required<ISheetOptions>>(key: K): Observable<Required<ISheetOptions>[K]> {
    let obs$ = this.getMap.get(key) as Observable<Required<ISheetOptions>[K]> | undefined;
    if (!obs$) {
      obs$ = this.dispositionSubject.pipe(
        switchMap(() => this.options$),
        map((options) => options[key]),
        distinctUntilChanged(),
        finalize(() => void this.getMap.delete(key)),
        shareReplay({ refCount: true, bufferSize: 1 }),
      );
      this.getMap.set(key, obs$);
    }
    return obs$;
  }

  set(options: Partial<ISheetOptions> | ((options: Required<ISheetOptions>) => Required<ISheetOptions>)): void {
    this.optionsSubject.next(typeof options === 'function' ? options(this.options) : { ...this.options, ...options });
  }
}
