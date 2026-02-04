import type { IDimension, IOffset, IScrollOffset } from '../core';
import type { IAccumulatedDimensionManager } from '../data';
import type { ISheetDimension, IViewport, IViewportChangePatch, IViewportManager, IViewportOptions } from './types';

import { type Observable, scan, Subject } from 'rxjs';
import { combineLatest, map, startWith } from 'rxjs';

import { ObservableDisposable } from '../core';

import { EFreezeMode } from './types';

interface ICache {
  offset: IOffset;
  sheetSize: IDimension;

  frozenWidth: number;
  frozenHeight: number;
  frozenRowCount: number;
  frozenColumnCount: number;

  vertical: [rowStartIndex: number, rowEndIndex: number, rowKey: string];
  horizontal: [columnStartIndex: number, columnEndIndex: number, columnKey: string];
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

    const cache$ = this.buildCache(offset, sheet, options, row, column);

    this.disposeWithMe(
      cache$.subscribe((cache) => {
        const { deltaX, deltaY } = cache.offset;
        const [rowStartIndex, rowEndIndex] = cache.vertical;
        const [columnStartIndex, columnEndIndex] = cache.horizontal;
        const { width: sheetWidth, height: sheetHeight } = cache.sheetSize;
        const { frozenWidth, frozenHeight, frozenRowCount, frozenColumnCount } = cache;

        const nextViewports: Record<EFreezeMode, IViewport> = {
          [EFreezeMode.BOTH]: {
            frozenRowCount,
            frozenColumnCount,
            x: 0,
            y: 0,
            width: frozenWidth,
            height: frozenHeight,
            deltaX: 0,
            deltaY: 0,
            rowStartIndex: 0,
            rowEndIndex: frozenRowCount - 1,
            columnStartIndex: 0,
            columnEndIndex: frozenColumnCount - 1,
          },
          [EFreezeMode.ROW]: {
            frozenRowCount,
            frozenColumnCount,
            x: frozenWidth,
            y: 0,
            width: sheetWidth - frozenWidth,
            height: frozenHeight,
            deltaX,
            deltaY: 0,
            rowStartIndex: 0,
            rowEndIndex: frozenRowCount - 1,
            columnStartIndex,
            columnEndIndex,
          },
          [EFreezeMode.COLUMN]: {
            frozenRowCount,
            frozenColumnCount,
            x: 0,
            y: frozenHeight,
            width: frozenWidth,
            height: sheetHeight - frozenHeight,
            deltaX: 0,
            deltaY,
            rowStartIndex,
            rowEndIndex,
            columnStartIndex: 0,
            columnEndIndex: frozenColumnCount - 1,
          },
          [EFreezeMode.NONE]: {
            frozenRowCount,
            frozenColumnCount,
            x: frozenWidth,
            y: frozenHeight,
            width: sheetWidth - frozenWidth,
            height: sheetHeight - frozenHeight,
            deltaX,
            deltaY,
            rowStartIndex,
            rowEndIndex,
            columnStartIndex,
            columnEndIndex,
          },
        };

        FROZEN_MODE_LIST.forEach((mode) => {
          const previous = this[mode];
          const current = nextViewports[mode];

          if (isViewportEqual(previous, current)) return;

          this[mode] = current;
          this.subject.next({ mode, previous, current });
        });
      }),
    );
  }

  private buildCache(
    offset: IScrollOffset,
    sheet: ISheetDimension,
    options: IViewportOptions,
    row: IAccumulatedDimensionManager,
    column: IAccumulatedDimensionManager,
  ): Observable<ICache> {
    const width$ = combineLatest([options.frozenColumnCount$, column.change$]).pipe(
      map(([frozenColumnCount]) => [column.get(frozenColumnCount), frozenColumnCount] as const),
    );

    const height$ = combineLatest([options.frozenRowCount$, row.change$]).pipe(
      map(([frozenRowCount]) => [row.get(frozenRowCount), frozenRowCount] as const),
    );

    const size$ = sheet.change$.pipe(
      map(() => sheet.size),
      startWith(sheet.size),
    );

    const offset$ = offset.change$.pipe(
      map(() => offset.offset),
      startWith(offset.offset),
    );

    return combineLatest([width$, height$, size$, offset$]).pipe(
      scan(
        (acc, [[frozenWidth, frozenColumnCount], [frozenHeight, frozenRowCount], sheetSize, offset]) => {
          acc.offset = offset;
          acc.sheetSize = sheetSize;
          acc.frozenWidth = frozenWidth;
          acc.frozenHeight = frozenHeight;
          acc.frozenRowCount = frozenRowCount;
          acc.frozenColumnCount = frozenColumnCount;

          const rowKey = `${frozenHeight}-${sheetSize.height}-${offset.deltaY}`;
          if (rowKey !== acc.vertical[2]) {
            const vertical = row.findRange(frozenHeight + offset.deltaY, sheetSize.height + offset.deltaY);
            acc.vertical = [...vertical, rowKey];
          }

          const horizontalKey = `${frozenWidth}-${sheetSize.width}-${offset.deltaX}`;
          if (horizontalKey !== acc.horizontal[2]) {
            const horizontal = column.findRange(frozenWidth + offset.deltaX, sheetSize.width + offset.deltaX);
            acc.horizontal = [...horizontal, horizontalKey];
          }

          return acc;
        },
        { vertical: [0, 0, ''], horizontal: [0, 0, ''] } as ICache,
      ),
    );
  }
}

function getDefaultViewport(): IViewport {
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    deltaX: 0,
    deltaY: 0,
    frozenRowCount: 0,
    frozenColumnCount: 0,
    rowStartIndex: 0,
    rowEndIndex: -1,
    columnStartIndex: 0,
    columnEndIndex: -1,
  };
}

const FROZEN_MODE_LIST: EFreezeMode[] = [EFreezeMode.NONE, EFreezeMode.ROW, EFreezeMode.COLUMN, EFreezeMode.BOTH];

function isViewportEqual(a: IViewport, b: IViewport): boolean {
  if (a === b) return true;

  return (
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    a.deltaX === b.deltaX &&
    a.deltaY === b.deltaY &&
    a.rowStartIndex === b.rowStartIndex &&
    a.rowEndIndex === b.rowEndIndex &&
    a.columnStartIndex === b.columnStartIndex &&
    a.columnEndIndex === b.columnEndIndex &&
    a.frozenRowCount === b.frozenRowCount &&
    a.frozenColumnCount === b.frozenColumnCount
  );
}
