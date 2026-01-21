import type { ICellDimension, ISheetConfig } from '../../helpers';
import type { ICellPool } from '../../pools';
import type { IExcelEntrance } from '../../types';
import type Konva from 'konva';

import { Observable, switchMap } from 'rxjs';
import { combineLatest, distinctUntilChanged, map, of, shareReplay } from 'rxjs';

import { ObservableDisposable } from '../../core';

import { ECellFrozenType, type IContentRenderer, type IContentRendererContext } from './types';

/**
 * Text content renderer
 */
export class TextContentRenderer extends ObservableDisposable implements IContentRenderer {
  /**
   * Cell dimension
   */
  protected cellDimension: ICellDimension;

  /**
   * Cell pool
   */
  protected cellPool: ICellPool;

  /**
   * Excel entrance
   */
  protected excelEntrance: IExcelEntrance;

  /**
   * Sheet config
   */
  protected config: ISheetConfig;

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
   * @param cellDimension - Cell dimension
   * @param cellPool - Cell pool
   * @param excelEntrance - Excel entrance
   * @param config - Sheet config
   */
  constructor(cellDimension: ICellDimension, cellPool: ICellPool, excelEntrance: IExcelEntrance, config: ISheetConfig) {
    super();

    this.cellDimension = cellDimension;
    this.cellPool = cellPool;
    this.excelEntrance = excelEntrance;
    this.config = config;

    // ---- Rect ----

    this.defaultRectAttrs$ = this.config.options$.pipe(
      map((options) => options.defaultCellRectAttrs),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.defaultRectAttrs$.subscribe());

    this.defaultOddRectAttrs$ = combineLatest([
      this.defaultRectAttrs$,
      this.config.options$.pipe(
        map((options) => options.defaultOddCellRectAttrs),
        distinctUntilChanged(),
      ),
    ]).pipe(
      map(([defaultRectAttrs, oddRectAttrs]) => ({ ...defaultRectAttrs, ...oddRectAttrs })),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.defaultOddRectAttrs$.subscribe());

    this.defaultEvenRectAttrs$ = combineLatest([
      this.defaultRectAttrs$,
      this.config.options$.pipe(
        map((options) => options.defaultEvenCellRectAttrs),
        distinctUntilChanged(),
      ),
    ]).pipe(
      map(([defaultRectAttrs, evenRectAttrs]) => ({ ...defaultRectAttrs, ...evenRectAttrs })),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.defaultEvenRectAttrs$.subscribe());

    this.frozenRectAttrs$ = this.config.options$.pipe(
      map((options) => options.frozenCellRectAttrs),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.frozenRectAttrs$.subscribe());

    this.frozenOddRectAttrs$ = combineLatest([
      this.defaultOddRectAttrs$,
      this.frozenRectAttrs$,
      this.config.options$.pipe(
        map((options) => options.frozenOddCellRectAttrs),
        distinctUntilChanged(),
      ),
    ]).pipe(
      map(([defaultOddRectAttrs, frozenRectAttrs, oddRectAttrs]) => ({
        ...defaultOddRectAttrs,
        ...frozenRectAttrs,
        ...oddRectAttrs,
      })),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.frozenOddRectAttrs$.subscribe());

    this.frozenEvenRectAttrs$ = combineLatest([
      this.defaultEvenRectAttrs$,
      this.frozenRectAttrs$,
      this.config.options$.pipe(
        map((options) => options.frozenEvenCellRectAttrs),
        distinctUntilChanged(),
      ),
    ]).pipe(
      map(([defaultEvenRectAttrs, frozenRectAttrs, evenRectAttrs]) => ({
        ...defaultEvenRectAttrs,
        ...frozenRectAttrs,
        ...evenRectAttrs,
      })),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.frozenEvenRectAttrs$.subscribe());

    this.headerRectAttrs$ = this.config.options$.pipe(
      map((options) => options.headerCellRectAttrs),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.headerRectAttrs$.subscribe());

    this.columnHeaderRectAttrs$ = combineLatest([
      this.defaultRectAttrs$,
      this.frozenRectAttrs$,
      this.headerRectAttrs$,
      this.config.options$.pipe(
        map((options) => options.columnHeaderCellRectAttrs),
        distinctUntilChanged(),
      ),
    ]).pipe(
      map(([defaultRectAttrs, frozenRectAttrs, headerRectAttrs, columnHeaderRectAttrs]) => ({
        ...defaultRectAttrs,
        ...frozenRectAttrs,
        ...headerRectAttrs,
        ...columnHeaderRectAttrs,
      })),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.columnHeaderRectAttrs$.subscribe());

    this.rowHeaderRectAttrs$ = combineLatest([
      this.defaultRectAttrs$,
      this.frozenRectAttrs$,
      this.headerRectAttrs$,
      this.config.options$.pipe(
        map((options) => options.rowHeaderCellRectAttrs),
        distinctUntilChanged(),
      ),
    ]).pipe(
      map(([defaultRectAttrs, frozenRectAttrs, headerRectAttrs, rowHeaderRectAttrs]) => ({
        ...defaultRectAttrs,
        ...frozenRectAttrs,
        ...headerRectAttrs,
        ...rowHeaderRectAttrs,
      })),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.rowHeaderRectAttrs$.subscribe());

    this.cornerCellRectAttrs$ = combineLatest([
      this.defaultRectAttrs$,
      this.frozenRectAttrs$,
      this.headerRectAttrs$,
      this.config.options$.pipe(
        map((options) => options.cornerCellRectAttrs),
        distinctUntilChanged(),
      ),
    ]).pipe(
      map(([defaultRectAttrs, frozenRectAttrs, headerRectAttrs, cornerCellRectAttrs]) => ({
        ...defaultRectAttrs,
        ...frozenRectAttrs,
        ...headerRectAttrs,
        ...cornerCellRectAttrs,
      })),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.cornerCellRectAttrs$.subscribe());

    // ---- Text ----

    this.defaultTextAttrs$ = this.config.options$.pipe(
      map((options) => options.defaultCellTextAttrs),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.defaultTextAttrs$.subscribe());

    this.defaultOddTextAttrs$ = combineLatest([
      this.defaultTextAttrs$,
      this.config.options$.pipe(
        map((options) => options.defaultOddCellTextAttrs),
        distinctUntilChanged(),
      ),
    ]).pipe(
      map(([defaultTextAttrs, oddTextAttrs]) => ({ ...defaultTextAttrs, ...oddTextAttrs })),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.defaultOddTextAttrs$.subscribe());

    this.defaultEvenTextAttrs$ = combineLatest([
      this.defaultTextAttrs$,
      this.config.options$.pipe(
        map((options) => options.defaultEvenCellTextAttrs),
        distinctUntilChanged(),
      ),
    ]).pipe(
      map(([defaultTextAttrs, evenTextAttrs]) => ({ ...defaultTextAttrs, ...evenTextAttrs })),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.defaultEvenTextAttrs$.subscribe());

    this.frozenTextAttrs$ = this.config.options$.pipe(
      map((options) => options.frozenCellTextAttrs),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.frozenTextAttrs$.subscribe());

    this.frozenOddTextAttrs$ = combineLatest([
      this.defaultOddTextAttrs$,
      this.frozenTextAttrs$,
      this.config.options$.pipe(
        map((options) => options.frozenOddCellTextAttrs),
        distinctUntilChanged(),
      ),
    ]).pipe(
      map(([defaultOddTextAttrs, frozenTextAttrs, oddTextAttrs]) => ({
        ...defaultOddTextAttrs,
        ...frozenTextAttrs,
        ...oddTextAttrs,
      })),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.frozenOddTextAttrs$.subscribe());

    this.frozenEvenTextAttrs$ = combineLatest([
      this.defaultEvenTextAttrs$,
      this.frozenTextAttrs$,
      this.config.options$.pipe(
        map((options) => options.frozenEvenCellTextAttrs),
        distinctUntilChanged(),
      ),
    ]).pipe(
      map(([defaultEvenTextAttrs, frozenTextAttrs, evenTextAttrs]) => ({
        ...defaultEvenTextAttrs,
        ...frozenTextAttrs,
        ...evenTextAttrs,
      })),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.frozenEvenTextAttrs$.subscribe());

    this.headerTextAttrs$ = this.config.options$.pipe(
      map((options) => options.headerCellTextAttrs),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.headerTextAttrs$.subscribe());

    this.columnHeaderTextAttrs$ = combineLatest([
      this.defaultTextAttrs$,
      this.frozenTextAttrs$,
      this.headerTextAttrs$,
      this.config.options$.pipe(
        map((options) => options.columnHeaderCellTextAttrs),
        distinctUntilChanged(),
      ),
    ]).pipe(
      map(([headerTextAttrs, columnHeaderTextAttrs]) => ({ ...headerTextAttrs, ...columnHeaderTextAttrs })),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.columnHeaderTextAttrs$.subscribe());

    this.rowHeaderTextAttrs$ = combineLatest([
      this.defaultTextAttrs$,
      this.frozenTextAttrs$,
      this.headerTextAttrs$,
      this.config.options$.pipe(
        map((options) => options.rowHeaderCellTextAttrs),
        distinctUntilChanged(),
      ),
    ]).pipe(
      map(([headerTextAttrs, rowHeaderTextAttrs]) => ({ ...headerTextAttrs, ...rowHeaderTextAttrs })),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.rowHeaderTextAttrs$.subscribe());
  }

  /**
   * Render cell content
   *
   * @param content - Cell content
   * @param context - Render options
   */
  render(content: unknown, context: IContentRendererContext): Observable<void> {
    const { rowIndex, columnIndex } = context;

    return combineLatest([
      this.getRectAttrs$(context),
      this.getTextAttrs$(context),
      this.cellDimension.getCellRectBox$.pipe(map((getRectBox) => getRectBox(rowIndex, columnIndex))),
      this.cellPool.getRect$.pipe(
        switchMap(
          (getRect) =>
            new Observable<Konva.Rect>((observer) => {
              const rect = getRect();
              observer.next(rect);

              return () => {
                this.cellPool.disposeRect(rect);
              };
            }),
        ),
      ),
      this.cellPool.getText$.pipe(
        switchMap(
          (getText) =>
            new Observable<Konva.Text>((observer) => {
              const text = getText();
              observer.next(text);

              return () => {
                this.cellPool.disposeText(text);
              };
            }),
        ),
      ),
      this.excelEntrance.getCellGroup$.pipe(map((getGroup) => getGroup(rowIndex, columnIndex))),
    ]).pipe(
      map(([rectAttrs, textAttrs, box, rect, text, group]) => {
        const { x, y, width, height } = box;

        rect.setAttrs({
          ...rectAttrs,
          x,
          y,
          width,
          height,
        });
        if (rect.parent !== group) rect.moveTo(group);

        text.setAttrs({
          ...textAttrs,
          x,
          y,
          width,
          height,
          text: content?.toString() ?? '',
        });
        if (text.parent !== group) text.moveTo(group);
      }),
    );
  }

  /**
   * Get cell rect attributes
   *
   * @param context - Render options
   * @returns Observable of cell rect attributes
   */
  protected getRectAttrs$(context: IContentRendererContext): Observable<Partial<Konva.RectConfig>> {
    switch (context.frozenType) {
      case ECellFrozenType.Corner:
        if (context.rowIndex === 0 && context.columnIndex === 0) {
          return this.cornerCellRectAttrs$;
        } else if (context.rowIndex === 0) {
          return this.rowHeaderRectAttrs$;
        } else if (context.columnIndex === 0) {
          return this.columnHeaderRectAttrs$;
        } else {
          const mod = context.rowIndex % 2;
          if (mod === 1) {
            return this.frozenOddRectAttrs$;
          } else {
            return this.frozenEvenRectAttrs$;
          }
        }
      case ECellFrozenType.Header:
        if (context.rowIndex === 0) {
          return this.columnHeaderRectAttrs$;
        } else {
          const mod = context.rowIndex % 2;
          if (mod === 1) {
            return this.frozenOddRectAttrs$;
          } else {
            return this.frozenEvenRectAttrs$;
          }
        }
      case ECellFrozenType.Side:
        if (context.columnIndex === 0) {
          return this.rowHeaderRectAttrs$;
        } else {
          const mod = context.rowIndex % 2;
          if (mod === 1) {
            return this.frozenOddRectAttrs$;
          } else {
            return this.frozenEvenRectAttrs$;
          }
        }
      default:
        const mod = context.rowIndex % 2;
        if (mod === 1) {
          return this.defaultOddRectAttrs$;
        } else {
          return this.defaultEvenRectAttrs$;
        }
    }
  }

  /**
   * Get cell text attributes
   *
   * @param context - Render options
   * @returns Observable of cell text attributes
   */
  protected getTextAttrs$(context: IContentRendererContext): Observable<Partial<Konva.TextConfig>> {
    switch (context.frozenType) {
      case ECellFrozenType.Corner:
        if (context.rowIndex === 0 && context.columnIndex === 0) {
          return of({});
        } else if (context.rowIndex === 0) {
          return this.rowHeaderTextAttrs$;
        } else if (context.columnIndex === 0) {
          return this.columnHeaderTextAttrs$;
        } else {
          const mod = context.rowIndex % 2;
          if (mod === 1) {
            return this.frozenOddTextAttrs$;
          } else {
            return this.frozenEvenTextAttrs$;
          }
        }
      case ECellFrozenType.Header:
        if (context.rowIndex === 0) {
          return this.columnHeaderTextAttrs$;
        } else {
          const mod = context.rowIndex % 2;
          if (mod === 1) {
            return this.frozenOddTextAttrs$;
          } else {
            return this.frozenEvenTextAttrs$;
          }
        }
      case ECellFrozenType.Side:
        if (context.columnIndex === 0) {
          return this.rowHeaderTextAttrs$;
        } else {
          const mod = context.rowIndex % 2;
          if (mod === 1) {
            return this.frozenOddTextAttrs$;
          } else {
            return this.frozenEvenTextAttrs$;
          }
        }
      default:
        const mod = context.rowIndex % 2;
        if (mod === 1) {
          return this.defaultOddTextAttrs$;
        } else {
          return this.defaultEvenTextAttrs$;
        }
    }
  }
}
