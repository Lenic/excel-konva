import type { ICellDimension, IScrollOffset, ISheetConfig } from '../helpers';
import type { IShapePool } from '../pools';
import type { IExcelEntrance } from '../types';
import type {
  IContentContext,
  IContentManager,
  IEditContext,
  IRectRenderingContext,
  ITextRenderingContext,
} from './types';
import type Konva from 'konva';

import { combineLatest, distinctUntilChanged, exhaustMap, map, Observable, of, startWith, switchMap } from 'rxjs';

import { ObservableDisposable } from '../core';
import { EFreezeMode } from '../types';

import { EEditStatus } from './types';

/**
 * Abstract content manager
 */
export abstract class AbstractContentManager extends ObservableDisposable implements IContentManager {
  /**
   * Cell dimension
   */
  protected cellDimension: ICellDimension;

  /**
   * Cell pool
   */
  protected cellPool: IShapePool<Konva.RectConfig, Konva.Rect>;

  /**
   * Text pool
   */
  protected textPool: IShapePool<Konva.TextConfig, Konva.Text>;

  /**
   * Excel entrance
   */
  protected excelEntrance: IExcelEntrance;

  /**
   * Sheet config
   */
  protected config: ISheetConfig;

  /**
   * Offset
   */
  protected offset: IScrollOffset;

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
   * @param textPool - Text pool
   * @param excelEntrance - Excel entrance
   * @param config - Sheet config
   * @param offset - Scroll offset
   */
  constructor(
    cellDimension: ICellDimension,
    cellPool: IShapePool<Konva.RectConfig, Konva.Rect>,
    textPool: IShapePool<Konva.TextConfig, Konva.Text>,
    excelEntrance: IExcelEntrance,
    config: ISheetConfig,
    offset: IScrollOffset,
  ) {
    super();

    this.cellDimension = cellDimension;
    this.cellPool = cellPool;
    this.textPool = textPool;
    this.excelEntrance = excelEntrance;
    this.config = config;
    this.offset = offset;

    // ---- Rect ----

    this.defaultRectAttrs$ = this.config.options$.pipe(
      map((options) => options.defaultCellRectAttrs),
      distinctUntilChanged(),
      this.withPublish(),
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
      this.withPublish(),
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
      this.withPublish(),
    );
    this.disposeWithMe(this.defaultEvenRectAttrs$.subscribe());

    this.frozenRectAttrs$ = this.config.options$.pipe(
      map((options) => options.frozenCellRectAttrs),
      distinctUntilChanged(),
      this.withPublish(),
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
      this.withPublish(),
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
      this.withPublish(),
    );
    this.disposeWithMe(this.frozenEvenRectAttrs$.subscribe());

    this.headerRectAttrs$ = this.config.options$.pipe(
      map((options) => options.headerCellRectAttrs),
      distinctUntilChanged(),
      this.withPublish(),
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
      this.withPublish(),
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
      this.withPublish(),
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
      this.withPublish(),
    );
    this.disposeWithMe(this.cornerCellRectAttrs$.subscribe());

    // ---- Text ----

    this.defaultTextAttrs$ = this.config.options$.pipe(
      map((options) => options.defaultCellTextAttrs),
      distinctUntilChanged(),
      this.withPublish(),
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
      this.withPublish(),
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
      this.withPublish(),
    );
    this.disposeWithMe(this.defaultEvenTextAttrs$.subscribe());

    this.frozenTextAttrs$ = this.config.options$.pipe(
      map((options) => options.frozenCellTextAttrs),
      distinctUntilChanged(),
      this.withPublish(),
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
      this.withPublish(),
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
      this.withPublish(),
    );
    this.disposeWithMe(this.frozenEvenTextAttrs$.subscribe());

    this.headerTextAttrs$ = this.config.options$.pipe(
      map((options) => options.headerCellTextAttrs),
      distinctUntilChanged(),
      this.withPublish(),
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
      this.config.options$.pipe(
        map((options) => options.rowHeaderCellTextAttrs),
        distinctUntilChanged(),
      ),
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

  render(content: unknown, context: IContentContext): Observable<any> {
    const { rowIndex, columnIndex } = context;

    const rectAttrs$ = this.getRectAttrs$(context).pipe(this.withPublish());
    const textAttrs$ = this.getTextAttrs$(context).pipe(this.withPublish());
    const box$ = this.cellDimension.getCellRectBox$
      .pipe(map((getRectBox) => getRectBox(rowIndex, columnIndex)))
      .pipe(this.withPublish());
    const group$ = this.excelEntrance.getCellGroup$
      .pipe(map((getGroup) => getGroup(rowIndex, columnIndex)))
      .pipe(this.withPublish());

    const renderRect$ = this.renderRect({ ...context, box$, group$, rectAttrs$ });
    const renderText$ = this.renderText({ ...context, box$, group$, content, textAttrs$ });
    return combineLatest([renderRect$, renderText$]);
  }

  /**
   * Get rects
   *
   * @param count - Rect count
   * @returns Observable of rects definition
   */
  protected getRects(count: number): Observable<Konva.Rect[]> {
    if (count === 0) {
      return of([]);
    }

    return this.cellPool.get$.pipe(
      switchMap(
        (getRect) =>
          new Observable<Konva.Rect[]>((observer) => {
            const rects = Array.from({ length: count }).map(() => getRect());

            observer.next(rects);

            return () => {
              rects.forEach((rect) => {
                this.cellPool.reuse(rect);
              });
            };
          }),
      ),
    );
  }

  /**
   * Get texts
   *
   * @param count - Text count
   * @returns Observable of texts definition
   */
  protected getTexts(count: number): Observable<Konva.Text[]> {
    if (count === 0) {
      return of([]);
    }

    return this.textPool.get$.pipe(
      switchMap(
        (getText) =>
          new Observable<Konva.Text[]>((observer) => {
            const texts = Array.from({ length: count }).map(() => getText());

            observer.next(texts);

            return () => {
              texts.forEach((text) => {
                this.textPool.reuse(text);
              });
            };
          }),
      ),
    );
  }

  edit(content: unknown, context: IContentContext): Observable<EEditStatus> {
    const { rowIndex, columnIndex } = context;
    return this.cellDimension.getCellRectBox$.pipe(
      map((getRectBox) => getRectBox(rowIndex, columnIndex)),
      exhaustMap((box) => this.editContent({ ...context, box, content }).pipe(startWith(EEditStatus.Editing))),
    );
  }

  /**
   * Retrieves the visual attributes for the cell rectangle based on its freeze mode and position.
   *
   * @param context - The content context containing row/column indices and freeze mode.
   * @returns An Observable of the rectangle's configuration.
   */
  protected getRectAttrs$(context: IContentContext): Observable<Partial<Konva.RectConfig>> {
    switch (context.freezeMode) {
      case EFreezeMode.BOTH:
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
      case EFreezeMode.ROW:
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
      case EFreezeMode.COLUMN:
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
   * Retrieves the visual attributes for the cell text based on its freeze mode and position.
   *
   * @param context - The content context containing row/column indices and freeze mode.
   * @returns An Observable of the text's configuration.
   */
  protected getTextAttrs$(context: IContentContext): Observable<Partial<Konva.TextConfig>> {
    switch (context.freezeMode) {
      case EFreezeMode.BOTH:
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
      case EFreezeMode.ROW:
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
      case EFreezeMode.COLUMN:
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

  /**
   * Render rectangle
   *
   * @param context - Rect rendering context
   */
  /**
   * Render rectangle
   *
   * @param context - Rect rendering context
   */
  protected abstract renderRect(context: IRectRenderingContext): Observable<any>;

  /**
   * Render text
   *
   * @param context - Text rendering context
   */
  protected abstract renderText(context: ITextRenderingContext): Observable<any>;

  /**
   * Edit content
   *
   * @param context - Edit context
   */
  protected abstract editContent(context: IEditContext): Observable<EEditStatus>;
}
