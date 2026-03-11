import type { ICellRange, IDimension, IOffset, IScrollOffset } from '../core';
import type { IInformation, IRectBox, ISheetDimension, IViewport, IViewportManager } from './types';

import { distinctUntilChanged, filter, of } from 'rxjs';
import { combineLatest, map, startWith } from 'rxjs';

import { EFreezeMode } from '../core';
import { getDefaultValue, ObservableDisposable } from '../utils';

import { Viewport } from './viewport';

/**
 * ViewportManager
 */
export class ViewportManager extends ObservableDisposable implements IViewportManager {
  [EFreezeMode.NONE]!: IViewport;
  [EFreezeMode.ROW]!: IViewport;
  [EFreezeMode.COLUMN]!: IViewport;
  [EFreezeMode.BOTH]!: IViewport;

  /**
   * ViewportManager constructor
   *
   * @param offset - The offset to observe for dimension changes
   * @param sheet - The sheet to observe for dimension changes
   * @param scrollableRange - The scrollable range to observe for dimension changes
   * @param frozenInformation - The frozen information to observe for dimension changes
   */
  constructor(
    offset: IScrollOffset,
    sheet: ISheetDimension,
    scrollableRange: IInformation<ICellRange & { verticalKey: string; horizontalKey: string }>,
    frozenInformation: IInformation<IDimension & { rowCount: number; columnCount: number }>,
  ) {
    super();

    const box$ = frozenInformation.value$.pipe(
      distinctUntilChanged((x, y) => x.width === y.width && x.height === y.height),
      map(({ width, height }): IDimension => ({ width, height })),
      this.withPublish(),
    );

    const frozenRowCount$ = frozenInformation.value$.pipe(
      distinctUntilChanged((x, y) => x.rowCount === y.rowCount),
      map(({ rowCount }): number => rowCount),
      this.withPublish(),
    );

    const frozenColumnCount$ = frozenInformation.value$.pipe(
      distinctUntilChanged((x, y) => x.columnCount === y.columnCount),
      map(({ columnCount }): number => columnCount),
      this.withPublish(),
    );

    this[EFreezeMode.NONE] = new Viewport(
      combineLatest([
        sheet.change$.pipe(
          map(() => sheet.size),
          startWith(sheet.size),
        ),
        box$,
      ]).pipe(
        map(
          ([sheet, box]): IRectBox => ({
            x: box.width,
            y: box.height,
            width: sheet.width - box.width,
            height: sheet.height - box.height,
          }),
        ),
      ),
      offset.change$.pipe(
        map(() => offset.offset),
        startWith(offset.offset),
      ),
      scrollableRange.value$,
    );
    this.disposeWithMe(() => {
      this[EFreezeMode.NONE].dispose();
      this[EFreezeMode.NONE] = getDefaultValue<IViewport>();
    });

    this[EFreezeMode.ROW] = new Viewport(
      combineLatest([
        sheet.change$.pipe(
          filter((v) => v.type === 'both' || v.type === 'width'),
          map(() => sheet.width),
          startWith(sheet.width),
        ),
        box$,
      ]).pipe(
        map(
          ([totalWidth, { width, height }]): IRectBox => ({
            x: width,
            y: 0,
            width: totalWidth - width,
            height: height + 1,
          }),
        ),
      ),
      offset.change$.pipe(
        filter((v) => v.type === 'both' || v.type === 'left'),
        map(() => offset.left),
        startWith(offset.left),
        map((deltaX): IOffset => ({ deltaX, deltaY: 0 })),
      ),
      combineLatest([
        frozenRowCount$,
        scrollableRange.value$.pipe(distinctUntilChanged((x, y) => x.horizontalKey === y.horizontalKey)),
      ]).pipe(
        map(
          ([rowCount, { columnStartIndex, columnEndIndex }]): ICellRange => ({
            rowStartIndex: 0,
            rowEndIndex: rowCount - 1,
            columnStartIndex,
            columnEndIndex,
          }),
        ),
      ),
    );
    this.disposeWithMe(() => {
      this[EFreezeMode.ROW].dispose();
      this[EFreezeMode.ROW] = getDefaultValue<IViewport>();
    });

    this[EFreezeMode.COLUMN] = new Viewport(
      combineLatest([
        sheet.change$.pipe(
          filter((v) => v.type === 'both' || v.type === 'height'),
          map(() => sheet.height),
          startWith(sheet.height),
        ),
        box$,
      ]).pipe(
        map(
          ([totalHeight, { width, height }]): IRectBox => ({
            x: 0,
            y: height,
            width: width + 1,
            height: totalHeight - height,
          }),
        ),
      ),
      offset.change$.pipe(
        filter((v) => v.type === 'both' || v.type === 'top'),
        map(() => offset.top),
        startWith(offset.top),
        map((deltaY): IOffset => ({ deltaX: 0, deltaY })),
      ),
      combineLatest([
        frozenColumnCount$,
        scrollableRange.value$.pipe(distinctUntilChanged((x, y) => x.verticalKey === y.verticalKey)),
      ]).pipe(
        map(
          ([columnCount, { rowStartIndex, rowEndIndex }]): ICellRange => ({
            rowStartIndex,
            rowEndIndex,
            columnStartIndex: 0,
            columnEndIndex: columnCount - 1,
          }),
        ),
      ),
    );
    this.disposeWithMe(() => {
      this[EFreezeMode.COLUMN].dispose();
      this[EFreezeMode.COLUMN] = getDefaultValue<IViewport>();
    });

    this[EFreezeMode.BOTH] = new Viewport(
      box$.pipe(map(({ width, height }): IRectBox => ({ x: 0, y: 0, width, height }))),
      of<IOffset>({ deltaX: 0, deltaY: 0 }),
      combineLatest([frozenRowCount$, frozenColumnCount$]).pipe(
        map(
          ([rowCount, columnCount]): ICellRange => ({
            rowStartIndex: 0,
            rowEndIndex: rowCount - 1,
            columnStartIndex: 0,
            columnEndIndex: columnCount - 1,
          }),
        ),
      ),
    );
    this.disposeWithMe(() => {
      this[EFreezeMode.BOTH].dispose();
      this[EFreezeMode.BOTH] = getDefaultValue<IViewport>();
    });
  }
}
