import type { IDimension, IExcelEntrance } from '../types';
import type { IAccumulatedDimension, ISheetConfig, ISheetDimension } from './types';

import { animationFrameScheduler, auditTime, combineLatest, map, Observable, startWith } from 'rxjs';

import { ObservableDisposable } from '../core';

/**
 * Sheet dimension
 */
export class SheetDimension extends ObservableDisposable implements ISheetDimension {
  private sheetConfig: ISheetConfig;
  private excelEntrance: IExcelEntrance;
  private rowAccumulated: IAccumulatedDimension;
  private columnAccumulated: IAccumulatedDimension;

  visualSize: IDimension;
  realWidth: number;
  realHeight: number;
  realSize: IDimension;

  visualSize$: Observable<IDimension>;
  realWidth$: Observable<number>;
  realHeight$: Observable<number>;
  realSize$: Observable<IDimension>;

  /**
   * SheetDimension constructor
   *
   * @param rowAccumulated - The accumulated dimension manager for rows
   * @param columnAccumulated - The accumulated dimension manager for columns
   * @param sheetConfig - The sheet configuration
   * @param excelEntrance - The main entry point for the Excel component
   */
  constructor(
    rowAccumulated: IAccumulatedDimension,
    columnAccumulated: IAccumulatedDimension,
    sheetConfig: ISheetConfig,
    excelEntrance: IExcelEntrance,
  ) {
    super();

    this.rowAccumulated = rowAccumulated;
    this.columnAccumulated = columnAccumulated;
    this.sheetConfig = sheetConfig;
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

    this.realWidth$ = this.buildRealDimension(this.sheetConfig.get$('columnCount'), this.columnAccumulated.get$);
    this.disposeWithMe(
      this.realWidth$.subscribe((width) => {
        this.realWidth = width;
      }),
    );

    this.realHeight$ = this.buildRealDimension(this.sheetConfig.get$('rowCount'), this.rowAccumulated.get$);
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
