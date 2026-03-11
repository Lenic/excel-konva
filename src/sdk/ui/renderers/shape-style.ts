import type { ISheetConfig } from '../../core/types';
import type { IShapeStyleConfig } from './types';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

import { combineLatest, map, of } from 'rxjs';

import { EFreezeMode } from '../../core';
import { ObservableDisposable } from '../../utils';

/**
 * Shape style configuration implementation
 */
export class ShapeStyleConfig extends ObservableDisposable implements IShapeStyleConfig {
  private config: ISheetConfig;

  private defaultRectAttrs$: Observable<Partial<Konva.RectConfig>>;
  private defaultOddRectAttrs$: Observable<Partial<Konva.RectConfig>>;
  private defaultEvenRectAttrs$: Observable<Partial<Konva.RectConfig>>;
  private frozenRectAttrs$: Observable<Partial<Konva.RectConfig>>;
  private frozenOddRectAttrs$: Observable<Partial<Konva.RectConfig>>;
  private frozenEvenRectAttrs$: Observable<Partial<Konva.RectConfig>>;
  private headerRectAttrs$: Observable<Partial<Konva.RectConfig>>;
  private columnHeaderRectAttrs$: Observable<Partial<Konva.RectConfig>>;
  private rowHeaderRectAttrs$: Observable<Partial<Konva.RectConfig>>;
  private cornerCellRectAttrs$: Observable<Partial<Konva.RectConfig>>;
  private defaultTextAttrs$: Observable<Partial<Konva.TextConfig>>;
  private defaultOddTextAttrs$: Observable<Partial<Konva.TextConfig>>;
  private defaultEvenTextAttrs$: Observable<Partial<Konva.TextConfig>>;
  private frozenTextAttrs$: Observable<Partial<Konva.TextConfig>>;
  private frozenOddTextAttrs$: Observable<Partial<Konva.TextConfig>>;
  private frozenEvenTextAttrs$: Observable<Partial<Konva.TextConfig>>;
  private headerTextAttrs$: Observable<Partial<Konva.TextConfig>>;
  private columnHeaderTextAttrs$: Observable<Partial<Konva.TextConfig>>;
  private rowHeaderTextAttrs$: Observable<Partial<Konva.TextConfig>>;

  /**
   * Constructor
   *
   * @param config - Sheet configuration
   */
  constructor(config: ISheetConfig) {
    super();

    this.config = config;

    // ---- Rect Attributes ----

    this.defaultRectAttrs$ = this.config.get$('defaultCellRectAttrs');

    this.defaultOddRectAttrs$ = combineLatest([
      this.defaultRectAttrs$,
      this.config.get$('defaultOddCellRectAttrs'),
    ]).pipe(
      map(([defaultRectAttrs, oddRectAttrs]) => ({ ...defaultRectAttrs, ...oddRectAttrs })),
      this.withPublish(),
    );
    this.disposeWithMe(this.defaultOddRectAttrs$.subscribe());

    this.defaultEvenRectAttrs$ = combineLatest([
      this.defaultRectAttrs$,
      this.config.get$('defaultEvenCellRectAttrs'),
    ]).pipe(
      map(([defaultRectAttrs, evenRectAttrs]) => ({ ...defaultRectAttrs, ...evenRectAttrs })),
      this.withPublish(),
    );
    this.disposeWithMe(this.defaultEvenRectAttrs$.subscribe());

    this.frozenRectAttrs$ = this.config.get$('frozenCellRectAttrs');

    this.frozenOddRectAttrs$ = combineLatest([
      this.defaultOddRectAttrs$,
      this.frozenRectAttrs$,
      this.config.get$('frozenOddCellRectAttrs'),
    ]).pipe(
      map(([defaultOddRectAttrs, frozenRectAttrs, oddRectAttrs]) => ({
        ...defaultOddRectAttrs,
        ...frozenRectAttrs,
        ...oddRectAttrs,
      })),
      this.withPublish(),
    );
    this.disposeWithMe(this.frozenOddRectAttrs$.subscribe());

    this.frozenEvenRectAttrs$ = combineLatest([
      this.defaultEvenRectAttrs$,
      this.frozenRectAttrs$,
      this.config.get$('frozenEvenCellRectAttrs'),
    ]).pipe(
      map(([defaultEvenRectAttrs, frozenRectAttrs, evenRectAttrs]) => ({
        ...defaultEvenRectAttrs,
        ...frozenRectAttrs,
        ...evenRectAttrs,
      })),
      this.withPublish(),
    );
    this.disposeWithMe(this.frozenEvenRectAttrs$.subscribe());

    this.headerRectAttrs$ = this.config.get$('headerCellRectAttrs');

    this.columnHeaderRectAttrs$ = combineLatest([
      this.defaultRectAttrs$,
      this.frozenRectAttrs$,
      this.headerRectAttrs$,
      this.config.get$('columnHeaderCellRectAttrs'),
    ]).pipe(
      map(([defaultRectAttrs, frozenRectAttrs, headerRectAttrs, columnHeaderRectAttrs]) => ({
        ...defaultRectAttrs,
        ...frozenRectAttrs,
        ...headerRectAttrs,
        ...columnHeaderRectAttrs,
      })),
      this.withPublish(),
    );
    this.disposeWithMe(this.columnHeaderRectAttrs$.subscribe());

    this.rowHeaderRectAttrs$ = combineLatest([
      this.defaultRectAttrs$,
      this.frozenRectAttrs$,
      this.headerRectAttrs$,
      this.config.get$('rowHeaderCellRectAttrs'),
    ]).pipe(
      map(([defaultRectAttrs, frozenRectAttrs, headerRectAttrs, rowHeaderRectAttrs]) => ({
        ...defaultRectAttrs,
        ...frozenRectAttrs,
        ...headerRectAttrs,
        ...rowHeaderRectAttrs,
      })),
      this.withPublish(),
    );
    this.disposeWithMe(this.rowHeaderRectAttrs$.subscribe());

    this.cornerCellRectAttrs$ = combineLatest([
      this.defaultRectAttrs$,
      this.frozenRectAttrs$,
      this.headerRectAttrs$,
      this.config.get$('cornerCellRectAttrs'),
    ]).pipe(
      map(([defaultRectAttrs, frozenRectAttrs, headerRectAttrs, cornerCellRectAttrs]) => ({
        ...defaultRectAttrs,
        ...frozenRectAttrs,
        ...headerRectAttrs,
        ...cornerCellRectAttrs,
      })),
      this.withPublish(),
    );
    this.disposeWithMe(this.cornerCellRectAttrs$.subscribe());

    // ---- Text Attributes ----

    this.defaultTextAttrs$ = this.config.get$('defaultCellTextAttrs');

    this.defaultOddTextAttrs$ = combineLatest([
      this.defaultTextAttrs$,
      this.config.get$('defaultOddCellTextAttrs'),
    ]).pipe(
      map(([defaultTextAttrs, oddTextAttrs]) => ({ ...defaultTextAttrs, ...oddTextAttrs })),
      this.withPublish(),
    );
    this.disposeWithMe(this.defaultOddTextAttrs$.subscribe());

    this.defaultEvenTextAttrs$ = combineLatest([
      this.defaultTextAttrs$,
      this.config.get$('defaultEvenCellTextAttrs'),
    ]).pipe(
      map(([defaultTextAttrs, evenTextAttrs]) => ({ ...defaultTextAttrs, ...evenTextAttrs })),
      this.withPublish(),
    );
    this.disposeWithMe(this.defaultEvenTextAttrs$.subscribe());

    this.frozenTextAttrs$ = this.config.get$('frozenCellTextAttrs');

    this.frozenOddTextAttrs$ = combineLatest([
      this.defaultOddTextAttrs$,
      this.frozenTextAttrs$,
      this.config.get$('frozenOddCellTextAttrs'),
    ]).pipe(
      map(([defaultOddTextAttrs, frozenTextAttrs, oddTextAttrs]) => ({
        ...defaultOddTextAttrs,
        ...frozenTextAttrs,
        ...oddTextAttrs,
      })),
      this.withPublish(),
    );
    this.disposeWithMe(this.frozenOddTextAttrs$.subscribe());

    this.frozenEvenTextAttrs$ = combineLatest([
      this.defaultEvenTextAttrs$,
      this.frozenTextAttrs$,
      this.config.get$('frozenEvenCellTextAttrs'),
    ]).pipe(
      map(([defaultEvenTextAttrs, frozenTextAttrs, evenTextAttrs]) => ({
        ...defaultEvenTextAttrs,
        ...frozenTextAttrs,
        ...evenTextAttrs,
      })),
      this.withPublish(),
    );
    this.disposeWithMe(this.frozenEvenTextAttrs$.subscribe());

    this.headerTextAttrs$ = this.config.get$('headerCellTextAttrs');

    this.columnHeaderTextAttrs$ = combineLatest([
      this.defaultTextAttrs$,
      this.frozenTextAttrs$,
      this.headerTextAttrs$,
      this.config.get$('columnHeaderCellTextAttrs'),
    ]).pipe(
      map(([defaultTextAttrs, frozenTextAttrs, headerTextAttrs, columnHeaderTextAttrs]) => ({
        ...defaultTextAttrs,
        ...frozenTextAttrs,
        ...headerTextAttrs,
        ...columnHeaderTextAttrs,
      })),
      this.withPublish(),
    );
    this.disposeWithMe(this.columnHeaderTextAttrs$.subscribe());

    this.rowHeaderTextAttrs$ = combineLatest([
      this.defaultTextAttrs$,
      this.frozenTextAttrs$,
      this.headerTextAttrs$,
      this.config.get$('rowHeaderCellTextAttrs'),
    ]).pipe(
      map(([defaultTextAttrs, frozenTextAttrs, headerTextAttrs, rowHeaderTextAttrs]) => ({
        ...defaultTextAttrs,
        ...frozenTextAttrs,
        ...headerTextAttrs,
        ...rowHeaderTextAttrs,
      })),
      this.withPublish(),
    );
    this.disposeWithMe(this.rowHeaderTextAttrs$.subscribe());
  }

  getRectAttrs$(mode: EFreezeMode, rowIndex: number, columnIndex: number): Observable<Partial<Konva.RectConfig>> {
    switch (mode) {
      case EFreezeMode.BOTH:
        if (rowIndex === 0 && columnIndex === 0) {
          return this.cornerCellRectAttrs$;
        } else if (rowIndex === 0) {
          return this.rowHeaderRectAttrs$;
        } else if (columnIndex === 0) {
          return this.columnHeaderRectAttrs$;
        } else {
          const mod = rowIndex % 2;
          if (mod === 1) {
            return this.frozenOddRectAttrs$;
          } else {
            return this.frozenEvenRectAttrs$;
          }
        }
      case EFreezeMode.ROW:
        if (rowIndex === 0) {
          return this.columnHeaderRectAttrs$;
        } else {
          const mod = rowIndex % 2;
          if (mod === 1) {
            return this.frozenOddRectAttrs$;
          } else {
            return this.frozenEvenRectAttrs$;
          }
        }
      case EFreezeMode.COLUMN:
        if (columnIndex === 0) {
          return this.rowHeaderRectAttrs$;
        } else {
          const mod = rowIndex % 2;
          if (mod === 1) {
            return this.frozenOddRectAttrs$;
          } else {
            return this.frozenEvenRectAttrs$;
          }
        }
      default:
        const mod = rowIndex % 2;
        if (mod === 1) {
          return this.defaultOddRectAttrs$;
        } else {
          return this.defaultEvenRectAttrs$;
        }
    }
  }

  getTextAttrs$(mode: EFreezeMode, rowIndex: number, columnIndex: number): Observable<Partial<Konva.TextConfig>> {
    switch (mode) {
      case EFreezeMode.BOTH:
        if (rowIndex === 0 && columnIndex === 0) {
          return of({});
        } else if (rowIndex === 0) {
          return this.rowHeaderTextAttrs$;
        } else if (columnIndex === 0) {
          return this.columnHeaderTextAttrs$;
        } else {
          const mod = rowIndex % 2;
          if (mod === 1) {
            return this.frozenOddTextAttrs$;
          } else {
            return this.frozenEvenTextAttrs$;
          }
        }
      case EFreezeMode.ROW:
        if (rowIndex === 0) {
          return this.columnHeaderTextAttrs$;
        } else {
          const mod = rowIndex % 2;
          if (mod === 1) {
            return this.frozenOddTextAttrs$;
          } else {
            return this.frozenEvenTextAttrs$;
          }
        }
      case EFreezeMode.COLUMN:
        if (columnIndex === 0) {
          return this.rowHeaderTextAttrs$;
        } else {
          const mod = rowIndex % 2;
          if (mod === 1) {
            return this.frozenOddTextAttrs$;
          } else {
            return this.frozenEvenTextAttrs$;
          }
        }
      default:
        const mod = rowIndex % 2;
        if (mod === 1) {
          return this.defaultOddTextAttrs$;
        } else {
          return this.defaultEvenTextAttrs$;
        }
    }
  }
}
