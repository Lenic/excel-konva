import type { ISheetConfig } from '../../core/types';
import type { IShapeStyleConfig } from './types';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

import { combineLatest, map } from 'rxjs';

import { ObservableDisposable } from '../../utils';

/**
 * Shape style configuration implementation
 */
export class ShapeStyleConfig extends ObservableDisposable implements IShapeStyleConfig {
  /**
   * Sheet configuration
   */
  private config: ISheetConfig;

  /**
   * Observable that emits default rect attributes
   */
  readonly defaultRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits default odd rect attributes
   */
  readonly defaultOddRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits default even rect attributes
   */
  readonly defaultEvenRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits frozen rect attributes
   */
  readonly frozenRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits frozen odd rect attributes
   */
  readonly frozenOddRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits frozen even rect attributes
   */
  readonly frozenEvenRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits header rect attributes
   */
  readonly headerRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits column header rect attributes
   */
  readonly columnHeaderRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits row header rect attributes
   */
  readonly rowHeaderRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits corner cell rect attributes
   */
  readonly cornerCellRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits default text attributes
   */
  readonly defaultTextAttrs$: Observable<Partial<Konva.TextConfig>>;

  /**
   * Observable that emits default odd text attributes
   */
  readonly defaultOddTextAttrs$: Observable<Partial<Konva.TextConfig>>;

  /**
   * Observable that emits default even text attributes
   */
  readonly defaultEvenTextAttrs$: Observable<Partial<Konva.TextConfig>>;

  /**
   * Observable that emits frozen text attributes
   */
  readonly frozenTextAttrs$: Observable<Partial<Konva.TextConfig>>;

  /**
   * Observable that emits frozen odd text attributes
   */
  readonly frozenOddTextAttrs$: Observable<Partial<Konva.TextConfig>>;

  /**
   * Observable that emits frozen even text attributes
   */
  readonly frozenEvenTextAttrs$: Observable<Partial<Konva.TextConfig>>;

  /**
   * Observable that emits header text attributes
   */
  readonly headerTextAttrs$: Observable<Partial<Konva.TextConfig>>;

  /**
   * Observable that emits column header text attributes
   */
  readonly columnHeaderTextAttrs$: Observable<Partial<Konva.TextConfig>>;

  /**
   * Observable that emits row header text attributes
   */
  readonly rowHeaderTextAttrs$: Observable<Partial<Konva.TextConfig>>;

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
}
