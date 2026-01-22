import type { IDimension, IExcelEntrance } from '../types';
import type { IAccumulatedDimension, ISheetConfig, ISheetDimension } from './types';

import { animationFrameScheduler, auditTime, combineLatest, map, Observable, startWith } from 'rxjs';

import { ObservableDisposable } from '../core';

/**
 * Sheet dimension
 */
export class SheetDimension extends ObservableDisposable implements ISheetDimension {
  config: ISheetConfig;
  column: IAccumulatedDimension;
  row: IAccumulatedDimension;

  visualSize: IDimension;
  realWidth: number;
  realHeight: number;
  realSize: IDimension;
  excelEntrance: IExcelEntrance;

  visualSize$: Observable<IDimension>;
  realWidth$: Observable<number>;
  realHeight$: Observable<number>;
  realSize$: Observable<IDimension>;

  /**
   * Constructor
   *
   * @param config - Sheet
   * @param column - Accumulated column dimension
   * @param row - Accumulated row dimension
   * @param excelEntrance - Excel entrance
   */
  constructor(
    config: ISheetConfig,
    column: IAccumulatedDimension,
    row: IAccumulatedDimension,
    excelEntrance: IExcelEntrance,
  ) {
    super();

    this.config = config;
    this.column = column;
    this.row = row;
    this.excelEntrance = excelEntrance;

    this.visualSize = { width: 0, height: 0 };
    this.realWidth = 0;
    this.realHeight = 0;
    this.realSize = { width: 0, height: 0 };

    this.visualSize$ = new Observable<HTMLDivElement>((subscriber) => {
      const resizeObserver = new ResizeObserver(() => {
        subscriber.next(this.excelEntrance.rootElement);
      });
      resizeObserver.observe(this.excelEntrance.rootElement);
      return () => {
        resizeObserver.disconnect();
      };
    }).pipe(
      auditTime(16, animationFrameScheduler),
      startWith(this.excelEntrance.rootElement),
      map((el) => ({ width: el.clientWidth, height: el.clientHeight }) as IDimension),
      this.withPublish(),
    );
    this.disposeWithMe(
      this.visualSize$.subscribe((size) => {
        this.visualSize = size;
      }),
    );

    this.realWidth$ = this.buildRealDimension(this.config.get$('columnCount'), this.column.get$);
    this.disposeWithMe(
      this.realWidth$.subscribe((width) => {
        this.realWidth = width;
      }),
    );

    this.realHeight$ = this.buildRealDimension(this.config.get$('rowCount'), this.row.get$);
    this.disposeWithMe(
      this.realHeight$.subscribe((height) => {
        this.realHeight = height;
      }),
    );

    this.realSize$ = combineLatest([this.realWidth$, this.realHeight$]).pipe(
      map(([width, height]) => ({ width, height }) as IDimension),
      this.withPublish(),
    );
    this.disposeWithMe(
      this.realSize$.subscribe((size) => {
        this.realSize = size;
      }),
    );
  }

  private buildRealDimension(
    count$: Observable<number>,
    getPrecedingTotalDimension$: Observable<(index: number) => number>,
  ) {
    return combineLatest([count$, getPrecedingTotalDimension$]).pipe(
      map(([count, getPrecedingTotalDimension]) => getPrecedingTotalDimension(count)),
      this.withPublish(),
    );
  }
}
