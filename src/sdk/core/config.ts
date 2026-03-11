import type { IChangePatch, ISheetConfig, ISheetOptions } from './types';
import type { Observable } from 'rxjs';

import { filter, startWith, Subject } from 'rxjs';
import { distinctUntilChanged, finalize, map } from 'rxjs';

import { ObservableDisposable } from '../utils';

export const defaultSheetConfig: Required<ISheetOptions> = {
  headerHeight: 30,
  headerWidth: 40,
  rowHeight: 28,
  minimalRowHeight: 15,
  columnWidth: 100,
  minimalColumnWidth: 20,
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
    strokeWidth: 1,
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

type TChange = [key: string, patch: IChangePatch<any>];

/**
 * Sheet Config
 */
export class SheetConfig extends ObservableDisposable implements ISheetConfig {
  private changeListSubject: Subject<TChange[]>;
  private patchMap: Map<keyof Required<ISheetOptions>, Observable<any>>;
  private getterMap: Map<keyof Required<ISheetOptions>, Observable<any>>;

  options: Required<ISheetOptions>;

  /**
   * Constructor
   *
   * @param options - Sheet options
   */
  constructor(options: ISheetOptions = {}) {
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

    this.changeListSubject = new Subject<TChange[]>();
    this.disposeWithMe(() => {
      this.changeListSubject.complete();
    });

    this.patchMap = new Map<keyof Required<ISheetOptions>, Observable<any>>();
    this.disposeWithMe(() => {
      this.patchMap.clear();
    });

    this.getterMap = new Map<keyof Required<ISheetOptions>, Observable<any>>();
    this.disposeWithMe(() => {
      this.getterMap.clear();
    });
  }

  change$<K extends keyof Required<ISheetOptions>>(key: K): Observable<IChangePatch<Required<ISheetOptions>[K]>> {
    let obs$ = this.patchMap.get(key) as Observable<IChangePatch<Required<ISheetOptions>[K]>> | undefined;
    if (!obs$) {
      obs$ = this.changeListSubject.pipe(
        map((changes) => changes.find(([k]) => k === key)?.[1]),
        filter((patch): patch is IChangePatch<Required<ISheetOptions>[K]> => !!patch),
        distinctUntilChanged(),
        finalize(() => void this.patchMap.delete(key)),
        this.withShare(),
      );
      this.patchMap.set(key, obs$);
    }
    return obs$;
  }

  get$<K extends keyof Required<ISheetOptions>>(key: K): Observable<Required<ISheetOptions>[K]> {
    let obs$ = this.getterMap.get(key) as Observable<Required<ISheetOptions>[K]> | undefined;
    if (!obs$) {
      obs$ = this.change$(key).pipe(
        map((patch) => patch.current),
        startWith(this.options[key]),
        finalize(() => void this.getterMap.delete(key)),
        this.withPublish(),
      );
      this.getterMap.set(key, obs$);
    }
    return obs$;
  }

  set(options: Partial<ISheetOptions> | ((options: Required<ISheetOptions>) => Required<ISheetOptions>)): void {
    const originalOptions = this.options;
    const nextOptions = typeof options === 'function' ? options(this.options) : { ...this.options, ...options };

    const changes: [key: string, patch: IChangePatch<any>][] = [];
    Object.keys(nextOptions).forEach((key) => {
      const k = key as keyof Required<ISheetOptions>;
      const previous = originalOptions[k];
      const current = nextOptions[k];
      if (previous !== current) {
        changes.push([k, { previous, current }]);
      }
    });

    this.options = nextOptions;
    this.changeListSubject.next(changes);
  }
}
