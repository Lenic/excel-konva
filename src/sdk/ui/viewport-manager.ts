import type { ICellRange, IDimension, IOffset, IScrollOffset } from '../core';
import type { IAccumulatedDimensionManager } from '../data';
import type { IRectBox, ISheetDimension, IViewport, IViewportManager, IViewportOptions } from './types';
import type { Observable } from 'rxjs';

import { distinctUntilChanged, filter, of, scan } from 'rxjs';
import { combineLatest, map, startWith } from 'rxjs';

import { EFreezeMode } from '../reference';
import { ObservableDisposable } from '../utils';

import { Viewport } from './viewport';

type TIndex = [startIndex: number, endIndex: number, key: string];

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

    const box$ = this.buildFrozenDimension(options, row, column);
    const range$ = this.buildRange(box$, offset, sheet, row, column);

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
      range$.pipe(
        map(
          ({ horizontal, vertical }): ICellRange => ({
            rowStartIndex: vertical[0],
            rowEndIndex: vertical[1],
            columnStartIndex: horizontal[0],
            columnEndIndex: horizontal[1],
          }),
        ),
      ),
    );
    this.disposeWithMe(() => {
      this[EFreezeMode.NONE].dispose();
      this[EFreezeMode.NONE] = getDefaultValue();
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
        map(([totalWidth, { width, height }]): IRectBox => ({ x: width, y: 0, width: totalWidth - width, height })),
      ),
      offset.change$.pipe(
        filter((v) => v.type === 'both' || v.type === 'left'),
        map(() => offset.left),
        startWith(offset.left),
        map((deltaX): IOffset => ({ deltaX, deltaY: 0 })),
      ),
      combineLatest([
        options.frozenRowCount$,
        range$.pipe(distinctUntilChanged((x, y) => x.horizontal[2] === y.horizontal[2])),
      ]).pipe(
        map(
          ([rowCount, { horizontal }]): ICellRange => ({
            rowStartIndex: 0,
            rowEndIndex: rowCount - 1,
            columnStartIndex: horizontal[0],
            columnEndIndex: horizontal[1],
          }),
        ),
      ),
    );
    this.disposeWithMe(() => {
      this[EFreezeMode.ROW].dispose();
      this[EFreezeMode.ROW] = getDefaultValue();
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
        map(([totalHeight, { width, height }]): IRectBox => ({ x: 0, y: height, width, height: totalHeight - height })),
      ),
      offset.change$.pipe(
        filter((v) => v.type === 'both' || v.type === 'top'),
        map(() => offset.top),
        startWith(offset.top),
        map((deltaY): IOffset => ({ deltaX: 0, deltaY })),
      ),
      combineLatest([
        options.frozenColumnCount$,
        range$.pipe(distinctUntilChanged((x, y) => x.vertical[2] === y.vertical[2])),
      ]).pipe(
        map(
          ([columnCount, { vertical }]): ICellRange => ({
            rowStartIndex: vertical[0],
            rowEndIndex: vertical[1],
            columnStartIndex: 0,
            columnEndIndex: columnCount - 1,
          }),
        ),
      ),
    );
    this.disposeWithMe(() => {
      this[EFreezeMode.COLUMN].dispose();
      this[EFreezeMode.COLUMN] = getDefaultValue();
    });

    this[EFreezeMode.BOTH] = new Viewport(
      box$.pipe(map(({ width, height }): IRectBox => ({ x: 0, y: 0, width, height }))),
      of<IOffset>({ deltaX: 0, deltaY: 0 }),
      combineLatest([options.frozenRowCount$, options.frozenColumnCount$]).pipe(
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
      this[EFreezeMode.BOTH] = getDefaultValue();
    });
  }

  private buildFrozenDimension(
    options: IViewportOptions,
    row: IAccumulatedDimensionManager,
    column: IAccumulatedDimensionManager,
  ) {
    const width$ = combineLatest([options.frozenColumnCount$, column.change$.pipe(startWith(null))]).pipe(
      map(([frozenColumnCount]) => column.get(frozenColumnCount)),
      distinctUntilChanged(),
    );

    const height$ = combineLatest([options.frozenRowCount$, row.change$.pipe(startWith(null))]).pipe(
      map(([frozenRowCount]) => row.get(frozenRowCount)),
      distinctUntilChanged(),
    );

    return combineLatest([width$, height$]).pipe(
      map(([width, height]): IDimension => ({ width, height })),
      this.withPublish(),
    );
  }

  private buildRange(
    box$: Observable<IDimension>,
    offset: IScrollOffset,
    sheet: ISheetDimension,
    row: IAccumulatedDimensionManager,
    column: IAccumulatedDimensionManager,
  ) {
    const size$ = sheet.change$.pipe(
      map(() => sheet.size),
      startWith(sheet.size),
    );

    const offset$ = offset.change$.pipe(
      map(() => offset.offset),
      startWith(offset.offset),
    );
    return combineLatest([box$, offset$, size$]).pipe(
      scan(
        (acc, [{ width, height }, { deltaX, deltaY }, { width: sheetWidth, height: sheetHeight }]) => {
          const rowKey = `${height}-${sheetHeight}-${deltaY}`;
          if (rowKey !== acc.vertical[2]) {
            const vertical = row.findRange(height + deltaY, sheetHeight + deltaY);
            acc.vertical = [...vertical, rowKey];
          }

          const horizontalKey = `${width}-${sheetWidth}-${deltaX}`;
          if (horizontalKey !== acc.horizontal[2]) {
            const horizontal = column.findRange(width + deltaX, sheetWidth + deltaX);
            acc.horizontal = [...horizontal, horizontalKey];
          }

          return acc;
        },
        { vertical: [0, 0, ''] as TIndex, horizontal: [0, 0, ''] as TIndex },
      ),
      distinctUntilChanged((x, y) => x.horizontal[2] === y.horizontal[2] || x.vertical[2] === y.vertical[2]),
      this.withPublish(),
    );
  }
}

function getDefaultValue() {
  return undefined as unknown as IViewport;
}
