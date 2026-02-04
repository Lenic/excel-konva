import type { IAccumulatedDimensionManager } from '../cache';
import type { IScrollOffset, ISheetDimension, IViewport, IViewportManager, IViewportOptions } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, filter, map, startWith } from 'rxjs';

import { ObservableDisposable } from '../core';

import { EFreezeMode } from './types';

interface IFrozenInfo {
  frozenWidth: number;
  frozenHeight: number;
  frozenColumnCount: number;
  frozenRowCount: number;
}

export class ViewportManager extends ObservableDisposable implements IViewportManager {
  [EFreezeMode.NONE]!: Observable<IViewport>;
  [EFreezeMode.ROW]!: Observable<IViewport>;
  [EFreezeMode.COLUMN]!: Observable<IViewport>;
  [EFreezeMode.BOTH]!: Observable<IViewport>;

  constructor(
    offset: IScrollOffset,
    sheet: ISheetDimension,
    options: IViewportOptions,
    row: IAccumulatedDimensionManager,
    column: IAccumulatedDimensionManager,
  ) {
    super();

    const frozenInfo$ = this.buildFrozenInfo(options, row, column);

    this[EFreezeMode.NONE] = frozenInfo$.pipe(
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
      this.withPublish(),
    );
    this.disposeWithMe(this[EFreezeMode.NONE].subscribe());

    this[EFreezeMode.ROW] = combineLatest([
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
    ]).pipe(
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
      this.withPublish(),
    );
    this.disposeWithMe(this[EFreezeMode.ROW].subscribe());

    this[EFreezeMode.COLUMN] = combineLatest([
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
    ]).pipe(
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
      this.withPublish(),
    );
    this.disposeWithMe(this[EFreezeMode.COLUMN].subscribe());

    this[EFreezeMode.BOTH] = combineLatest([
      frozenInfo$,
      sheet.change$.pipe(
        map(() => sheet.size),
        startWith(sheet.size),
      ),
      offset.change$.pipe(
        map(() => offset.offset),
        startWith(offset.offset),
      ),
    ]).pipe(
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
      this.withPublish(),
    );
    this.disposeWithMe(this[EFreezeMode.BOTH].subscribe());
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
