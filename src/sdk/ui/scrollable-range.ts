import type { ICellRange, IDimension, IScrollOffset } from '../core';
import type { IAccumulatedDimensionManager } from '../data';
import type { IInformation, ISheetDimension } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, distinctUntilChanged, map, scan, startWith } from 'rxjs';

import { ObservableDisposable } from '../utils';

type TIndex = [startIndex: number, endIndex: number, key: string];

export class ScrollableRange
  extends ObservableDisposable
  implements IInformation<ICellRange & { verticalKey: string; horizontalKey: string }>
{
  value$: Observable<ICellRange & { verticalKey: string; horizontalKey: string }>;

  constructor(
    frozenDimension: IInformation<IDimension>,
    offset: IScrollOffset,
    sheet: ISheetDimension,
    row: IAccumulatedDimensionManager,
    column: IAccumulatedDimensionManager,
  ) {
    super();

    const size$ = sheet.change$.pipe(
      map(() => sheet.size),
      startWith(sheet.size),
    );

    const offset$ = offset.change$.pipe(
      map(() => offset.offset),
      startWith(offset.offset),
    );

    this.value$ = combineLatest([frozenDimension.value$, offset$, size$]).pipe(
      scan(
        (acc, [{ width, height }, { deltaX, deltaY }, { width: sheetWidth, height: sheetHeight }]) => {
          let changed = false;

          let nextVertical = acc.vertical;
          const rowKey = `${height}-${sheetHeight}-${deltaY}`;
          if (rowKey !== acc.vertical[2]) {
            changed = true;
            nextVertical = [...row.findRange(height + deltaY, sheetHeight + deltaY), rowKey];
          }

          let nextHorizontal = acc.horizontal;
          const horizontalKey = `${width}-${sheetWidth}-${deltaX}`;
          if (horizontalKey !== acc.horizontal[2]) {
            changed = true;
            nextHorizontal = [...column.findRange(width + deltaX, sheetWidth + deltaX), horizontalKey];
          }

          return changed ? { vertical: nextVertical, horizontal: nextHorizontal } : acc;
        },
        { vertical: [0, 0, ''] as TIndex, horizontal: [0, 0, ''] as TIndex },
      ),
      distinctUntilChanged((x, y) => x.horizontal[2] === y.horizontal[2] && x.vertical[2] === y.vertical[2]),
      map(({ horizontal, vertical }): ICellRange & { verticalKey: string; horizontalKey: string } => ({
        rowStartIndex: vertical[0],
        rowEndIndex: vertical[1],
        columnStartIndex: horizontal[0],
        columnEndIndex: horizontal[1],
        verticalKey: vertical[2],
        horizontalKey: horizontal[2],
      })),
      this.withPublish(),
    );
    this.disposeWithMe(this.value$.subscribe());
  }
}
