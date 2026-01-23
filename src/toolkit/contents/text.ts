import type { ICellDimension, IScrollOffset, ISheetConfig } from '../helpers';
import type { ICellPool } from '../pools';
import type { IExcelEntrance } from '../types';
import type { IContentContext, IContentManager } from './types';
import type Konva from 'konva';

import {
  combineLatest,
  distinctUntilChanged,
  EMPTY,
  exhaustMap,
  finalize,
  fromEvent,
  map,
  merge,
  Observable,
  of,
  skip,
  startWith,
  switchMap,
  take,
} from 'rxjs';

import { ObservableDisposable } from '../core';

import { EEditStatus } from './types';
import { ECellFrozenType } from './types';

/**
 * Text content renderer
 */
export class TextContentRenderer extends ObservableDisposable implements IContentManager {
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
   * @param excelEntrance - Excel entrance
   * @param config - Sheet config
   * @param offset - Scroll offset
   */
  constructor(
    cellDimension: ICellDimension,
    cellPool: ICellPool,
    excelEntrance: IExcelEntrance,
    config: ISheetConfig,
    offset: IScrollOffset,
  ) {
    super();

    this.cellDimension = cellDimension;
    this.cellPool = cellPool;
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
      map(([headerTextAttrs, columnHeaderTextAttrs]) => ({ ...headerTextAttrs, ...columnHeaderTextAttrs })),
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
      map(([headerTextAttrs, rowHeaderTextAttrs]) => ({ ...headerTextAttrs, ...rowHeaderTextAttrs })),
      this.withPublish(),
    );
    this.disposeWithMe(this.rowHeaderTextAttrs$.subscribe());
  }

  render(content: unknown, context: IContentContext): Observable<void> {
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

  edit(content: unknown, context: IContentContext): Observable<EEditStatus> {
    const { rowIndex, columnIndex } = context;
    return this.cellDimension.getCellRectBox$.pipe(
      map((getRectBox) => getRectBox(rowIndex, columnIndex)),
      exhaustMap((box) => {
        const { x, y, width, height } = box;

        const editor = document.createElement('textarea');
        editor.id = `cell-text-editor-${Date.now()}`;
        editor.classList.add('cell-text-editor');
        this.excelEntrance.rootElement.appendChild(editor);

        editor.value = content?.toString() ?? '';

        editor.style.left = `${x - 1}px`;
        editor.style.top = `${y - 1}px`;
        editor.style.width = `${width + 2}px`;
        editor.style.height = `${height + 2}px`;
        editor.style.lineHeight = `${height - 2}px`;

        editor.focus();
        editor.select();

        return merge(
          context.frozenType !== ECellFrozenType.None
            ? EMPTY
            : this.offset.offset$.pipe(
                skip(1),
                map(() => false),
              ),
          context.frozenType !== ECellFrozenType.Side
            ? EMPTY
            : this.offset.top$.pipe(
                skip(1),
                map(() => false),
              ),
          context.frozenType !== ECellFrozenType.Header
            ? EMPTY
            : this.offset.left$.pipe(
                skip(1),
                map(() => false),
              ),
          fromEvent<KeyboardEvent>(editor, 'keydown').pipe(
            switchMap((e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                return of(true);
              } else if (e.key === 'Escape') {
                return of(false);
              }
              return EMPTY;
            }),
          ),
          fromEvent(editor, 'blur').pipe(map(() => true)),
        ).pipe(
          take(1),
          finalize(() => {
            editor.remove();
          }),
          map((save) => {
            if (save) {
              const newText = editor.value;
              this.cellDimension.setCellData(rowIndex, columnIndex, newText || null);
            }

            return save ? EEditStatus.Saved : EEditStatus.Canceled;
          }),
          startWith(EEditStatus.Editing),
        );
      }),
    );
  }

  /**
   * Get cell rect attributes
   *
   * @param context - Render options
   * @returns Observable of cell rect attributes
   */
  protected getRectAttrs$(context: IContentContext): Observable<Partial<Konva.RectConfig>> {
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
  protected getTextAttrs$(context: IContentContext): Observable<Partial<Konva.TextConfig>> {
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
