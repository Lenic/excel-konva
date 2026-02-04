import type { IScrollOffset } from '../core';
import type { IAccumulatedDimensionManager } from '../data';
import type { ISheetDimension, IViewport, IViewportChangePatch, IViewportManager, IViewportOptions } from './types';

import { type Observable, Subject } from 'rxjs';
import { combineLatest, filter, map, startWith } from 'rxjs';

import { ObservableDisposable } from '../core';

import { EFreezeMode } from './types';

interface IFrozenInfo {
  frozenWidth: number;
  frozenHeight: number;
  frozenColumnCount: number;
  frozenRowCount: number;
}

/**
 * ViewportManager
 */
export class ViewportManager extends ObservableDisposable implements IViewportManager {
  private subject: Subject<IViewportChangePatch>;

  [EFreezeMode.NONE]!: IViewport;
  [EFreezeMode.ROW]!: IViewport;
  [EFreezeMode.COLUMN]!: IViewport;
  [EFreezeMode.BOTH]!: IViewport;

  change$: Observable<IViewportChangePatch>;

  /**
   * ViewportManager constructor
   *
   * @param offset - The offset to observe for dimension changes
   * @param sheet - The sheet to observe for dimension changes
   * @param options - The viewport options
   * @param row - The row to observe for dimension changes
   * @param column - The column to observe for dimension changes
   */
  constructor(
    offset: IScrollOffset,
    sheet: ISheetDimension,
    options: IViewportOptions,
    row: IAccumulatedDimensionManager,
    column: IAccumulatedDimensionManager,
  ) {
    super();

    this.subject = new Subject<IViewportChangePatch>();
    this.disposeWithMe(() => {
      this.subject.complete();
    });
    this.change$ = this.subject.asObservable();

    this[EFreezeMode.NONE] = getDefaultViewport();
    this.disposeWithMe(() => void (this[EFreezeMode.NONE] = null as unknown as IViewport));

    this[EFreezeMode.ROW] = getDefaultViewport();
    this.disposeWithMe(() => void (this[EFreezeMode.ROW] = null as unknown as IViewport));

    this[EFreezeMode.COLUMN] = getDefaultViewport();
    this.disposeWithMe(() => void (this[EFreezeMode.COLUMN] = null as unknown as IViewport));

    this[EFreezeMode.BOTH] = getDefaultViewport();
    this.disposeWithMe(() => void (this[EFreezeMode.BOTH] = null as unknown as IViewport));

    const frozenInfo$ = this.buildFrozenInfo(options, row, column);

    this.disposeWithMe(
      combineLatest([
        frozenInfo$,
        sheet.change$.pipe(
          map(() => sheet.size),
          startWith(sheet.size),
        ),
        offset.change$.pipe(
          map(() => offset.offset),
          startWith(offset.offset),
        ),
      ])
        .pipe(
          map(
            ([{ frozenWidth: width, frozenHeight: height, ...rest }, sheetBoth, offset]): IViewport => ({
              ...rest,
              x: width,
              y: height,
              width: sheetBoth.width - width,
              height: sheetBoth.height - height,
              ...offset,
            }),
          ),
        )
        .subscribe((viewport) => {
          const previous = this[EFreezeMode.BOTH];
          this[EFreezeMode.BOTH] = viewport;
          this.subject.next({ mode: EFreezeMode.BOTH, previous, current: viewport });
        }),
    );

    this.disposeWithMe(
      combineLatest([
        frozenInfo$,
        sheet.change$.pipe(
          filter((v) => v.type === 'both' || v.type === 'width'),
          map(() => sheet.width),
          startWith(sheet.width),
        ),
        offset.change$.pipe(
          filter((v) => v.type === 'both' || v.type === 'left'),
          map(() => offset.left),
          startWith(offset.left),
        ),
      ])
        .pipe(
          map(
            ([{ frozenWidth: width, frozenHeight: height, ...rest }, sheetWidth, deltaX]): IViewport => ({
              ...rest,
              x: width,
              y: 0,
              width: sheetWidth - width,
              height,
              deltaX,
              deltaY: 0,
            }),
          ),
        )
        .subscribe((viewport) => {
          const previous = this[EFreezeMode.ROW];
          this[EFreezeMode.ROW] = viewport;
          this.subject.next({ mode: EFreezeMode.ROW, previous, current: viewport });
        }),
    );

    this.disposeWithMe(
      combineLatest([
        frozenInfo$,
        sheet.change$.pipe(
          filter((v) => v.type === 'both' || v.type === 'height'),
          map(() => sheet.height),
          startWith(sheet.height),
        ),
        offset.change$.pipe(
          filter((v) => v.type === 'both' || v.type === 'top'),
          map(() => offset.top),
          startWith(offset.top),
        ),
      ])
        .pipe(
          map(
            ([{ frozenWidth: width, frozenHeight: height, ...rest }, sheetHeight, deltaY]): IViewport => ({
              ...rest,
              x: 0,
              y: height,
              width,
              height: sheetHeight - height,
              deltaX: 0,
              deltaY,
            }),
          ),
        )
        .subscribe((viewport) => {
          const previous = this[EFreezeMode.COLUMN];
          this[EFreezeMode.COLUMN] = viewport;
          this.subject.next({ mode: EFreezeMode.COLUMN, previous, current: viewport });
        }),
    );

    this.disposeWithMe(
      frozenInfo$
        .pipe(
          map(
            ({ frozenWidth: width, frozenHeight: height, ...rest }): IViewport => ({
              ...rest,
              x: 0,
              y: 0,
              width,
              height,
              deltaX: 0,
              deltaY: 0,
            }),
          ),
        )
        .subscribe((viewport) => {
          const previous = this[EFreezeMode.NONE];
          this[EFreezeMode.NONE] = viewport;
          this.subject.next({ mode: EFreezeMode.NONE, previous, current: viewport });
        }),
    );
  }

  private buildFrozenInfo(
    options: IViewportOptions,
    row: IAccumulatedDimensionManager,
    column: IAccumulatedDimensionManager,
  ): Observable<IFrozenInfo> {
    const width$ = combineLatest([options.frozenColumnCount$, column.change$]).pipe(
      map(([frozenColumnCount]) => [column.get(frozenColumnCount), frozenColumnCount] as const),
    );

    const height$ = combineLatest([options.frozenRowCount$, row.change$]).pipe(
      map(([frozenRowCount]) => [row.get(frozenRowCount), frozenRowCount] as const),
    );

    return combineLatest([width$, height$]).pipe(
      map(([[frozenWidth, frozenColumnCount], [frozenHeight, frozenRowCount]]) => ({
        frozenWidth,
        frozenHeight,
        frozenColumnCount,
        frozenRowCount,
      })),
      this.withPublish(),
    );
  }
}

function getDefaultViewport(): IViewport {
  return { x: 0, y: 0, width: 0, height: 0, deltaX: 0, deltaY: 0, frozenRowCount: 0, frozenColumnCount: 0 };
}
