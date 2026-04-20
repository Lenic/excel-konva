import type { IDimension, IObservableValue, IScrollOffset } from '../core';
import type { IAccumulatedDimensionManager, IAccumulatedFindOptions } from '../data';
import type { IScrollableRange, ISheetDimension } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, distinctUntilChanged, map, scan, startWith, tap } from 'rxjs';

import { createNewFindOptions, getDefaultValue, ObservableDisposable } from '../utils';

type TIndex = [startIndex: number, endIndex: number, key: string];

export class ScrollableRangeManager extends ObservableDisposable implements IObservableValue<IScrollableRange> {
  private rowFindEndOptions: IAccumulatedFindOptions;
  private rowFindBeginOptions: IAccumulatedFindOptions;
  private columnFindEndOptions: IAccumulatedFindOptions;
  private columnFindBeginOptions: IAccumulatedFindOptions;

  value: IScrollableRange;
  value$: Observable<IScrollableRange>;

  constructor(
    frozenDimension: IObservableValue<IDimension>,
    offset: IScrollOffset,
    sheet: ISheetDimension,
    row: IAccumulatedDimensionManager,
    column: IAccumulatedDimensionManager,
  ) {
    super();

    this.value = {
      rowStartIndex: 0,
      rowEndIndex: 0,
      columnStartIndex: 0,
      columnEndIndex: 0,
      verticalKey: '',
      horizontalKey: '',
    };
    this.disposeWithMe(() => void (this.value = getDefaultValue<IScrollableRange>()));

    this.rowFindEndOptions = createNewFindOptions(-1);
    this.disposeWithMe(() => void (this.rowFindEndOptions = getDefaultValue<IAccumulatedFindOptions>()));
    this.rowFindBeginOptions = createNewFindOptions(1);
    this.disposeWithMe(() => void (this.rowFindBeginOptions = getDefaultValue<IAccumulatedFindOptions>()));
    this.columnFindEndOptions = createNewFindOptions(-1);
    this.disposeWithMe(() => void (this.columnFindEndOptions = getDefaultValue<IAccumulatedFindOptions>()));
    this.columnFindBeginOptions = createNewFindOptions(1);
    this.disposeWithMe(() => void (this.columnFindBeginOptions = getDefaultValue<IAccumulatedFindOptions>()));

    const size$ = sheet.change$.pipe(
      map(() => sheet.size),
      startWith(sheet.size),
    );

    const offset$ = offset.change$.pipe(
      map(() => offset.offset),
      startWith(offset.offset),
    );

    const rowVersion$ = row.change$.pipe(
      tap(() => {
        this.rowFindEndOptions = createNewFindOptions(-1);
        this.rowFindBeginOptions = createNewFindOptions(1);
      }),
      startWith(null),
      scan((acc) => acc + 1, 0),
    );

    const columnVersion$ = column.change$.pipe(
      tap(() => {
        this.columnFindEndOptions = createNewFindOptions(-1);
        this.columnFindBeginOptions = createNewFindOptions(1);
      }),
      startWith(null),
      scan((acc) => acc + 1, 0),
    );

    this.value$ = combineLatest([frozenDimension.value$, offset$, size$, rowVersion$, columnVersion$]).pipe(
      scan(
        (
          acc,
          [
            { width, height },
            { deltaX, deltaY },
            { width: sheetWidth, height: sheetHeight },
            rowVersion,
            columnVersion,
          ],
        ) => {
          let changed = false;

          let nextVertical = acc.vertical;
          const verticalKey = `${height}-${sheetHeight}-${deltaY}-${rowVersion}`;
          if (verticalKey !== acc.vertical[2]) {
            changed = true;
            const beginIndex = row.findIndex(height + deltaY, this.rowFindBeginOptions);
            nextVertical = [
              beginIndex,
              row.findIndex(sheetHeight + deltaY, { ...this.rowFindEndOptions, startIndex: beginIndex }),
              verticalKey,
            ];
          }

          let nextHorizontal = acc.horizontal;
          const horizontalKey = `${width}-${sheetWidth}-${deltaX}-${columnVersion}`;
          if (horizontalKey !== acc.horizontal[2]) {
            changed = true;
            const beginIndex = column.findIndex(width + deltaX, this.columnFindBeginOptions);
            nextHorizontal = [
              beginIndex,
              column.findIndex(sheetWidth + deltaX, { ...this.columnFindEndOptions, startIndex: beginIndex }),
              horizontalKey,
            ];
          }

          return changed ? { vertical: nextVertical, horizontal: nextHorizontal } : acc;
        },
        { vertical: [0, 0, ''] as TIndex, horizontal: [0, 0, ''] as TIndex },
      ),
      distinctUntilChanged((x, y) => x.horizontal[2] === y.horizontal[2] && x.vertical[2] === y.vertical[2]),
      map(
        ({ horizontal, vertical }): IScrollableRange => ({
          rowStartIndex: vertical[0],
          rowEndIndex: vertical[1],
          columnStartIndex: horizontal[0],
          columnEndIndex: horizontal[1],
          verticalKey: vertical[2],
          horizontalKey: horizontal[2],
        }),
      ),
      this.withPublish(),
    );
    this.disposeWithMe(this.value$.subscribe((value) => void (this.value = value)));
  }
}
