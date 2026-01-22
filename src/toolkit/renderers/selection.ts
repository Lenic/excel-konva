import type { ISelectionStore } from '../events';
import type { ICellDimension, IScrollOffset, ISheetConfig, ISheetDimension } from '../helpers';
import type { IRectPool } from '../pools';
import type { ILocation, IRegionInfo } from '../types';
import type Konva from 'konva';

import { combineLatestWith, EMPTY, Observable, of } from 'rxjs';
import { combineLatest, distinctUntilChanged, map, switchMap, take } from 'rxjs';

import { ServiceLocator } from '../../container';

import { RenderListener } from './renderer';
import { CollectionSubscription } from './subscription';
import { IRangeCollection } from './types';

/**
 * Selection renderer
 */
export class SelectionListener extends RenderListener<number> {
  private config: ISheetConfig;
  private sheetDimension: ISheetDimension;
  private cellDimension: ICellDimension;
  private selectionStore: ISelectionStore;
  private selectionPool: IRectPool;
  private activeCellMarkerPool: IRectPool;
  private scrollOffset: IScrollOffset;
  private subscriptions: CollectionSubscription;

  /**
   * Constructor
   * @param config Sheet config
   * @param sheetDimension Sheet dimension
   * @param cellDimension Cell dimension
   * @param selectionStore Selection store
   * @param selectionPool Selection pool
   * @param activeCellMarkerPool Active cell marker pool
   * @param scrollOffset Scroll offset
   */
  constructor(
    config: ISheetConfig,
    sheetDimension: ISheetDimension,
    cellDimension: ICellDimension,
    selectionStore: ISelectionStore,
    selectionPool: IRectPool,
    activeCellMarkerPool: IRectPool,
    scrollOffset: IScrollOffset,
  ) {
    super();

    this.config = config;
    this.sheetDimension = sheetDimension;
    this.cellDimension = cellDimension;
    this.selectionStore = selectionStore;
    this.selectionPool = selectionPool;
    this.activeCellMarkerPool = activeCellMarkerPool;
    this.scrollOffset = scrollOffset;

    this.subscriptions = new CollectionSubscription();
    this.disposeWithMe(this.subscriptions);
  }

  protected build(): Observable<number> {
    return combineLatest([
      this.config.get$('frozenColumns'),
      this.config.get$('frozenRows'),
      this.selectionStore.list$,
    ]).pipe(
      map(([frozenColumns, frozenRows, selectedRanges]) => {
        const highlightedRows = ServiceLocator.current.get(IRangeCollection);
        const highlightedColumns = ServiceLocator.current.get(IRangeCollection);

        const items: [key: string, item: Observable<any>][] = [];

        selectedRanges.forEach(({ activeCell, region }) => {
          const { rowIndex, columnIndex } = activeCell;
          const { startColumnIndex, startRowIndex, endColumnIndex, endRowIndex } = region;

          const suffix = `${startColumnIndex}-${startRowIndex}-${endColumnIndex}-${endRowIndex}-${rowIndex}-${columnIndex}`;

          // ---- region ----

          // A. Draw Data Area selection
          const dataStartRowIndex = Math.max(startRowIndex, frozenRows);
          const dataStartColumnIndex = Math.max(startColumnIndex, frozenColumns);

          if (dataStartRowIndex <= endRowIndex && dataStartColumnIndex <= endColumnIndex) {
            items.push([
              `data-${suffix}`,
              this.renderSelectionRegion(this.scrollOffset.offset$, {
                startRowIndex: dataStartRowIndex,
                endRowIndex,
                startColumnIndex: dataStartColumnIndex,
                endColumnIndex,
              }),
            ]);
          }

          // B. Draw Frozen Side Area selection
          const sideStartRowIndex = Math.max(startRowIndex, frozenRows);
          const sideEndRowIndex = endRowIndex;
          const sideStartColumnIndex = startColumnIndex;
          const sideEndColumnIndex = Math.min(endColumnIndex, frozenColumns - 1);

          if (sideStartRowIndex <= sideEndRowIndex && sideStartColumnIndex <= sideEndColumnIndex) {
            items.push([
              `side-${suffix}`,
              this.renderSelectionRegion(this.scrollOffset.top$, {
                startRowIndex: sideStartRowIndex,
                endRowIndex: sideEndRowIndex,
                startColumnIndex: sideStartColumnIndex,
                endColumnIndex: sideEndColumnIndex,
              }),
            ]);
          }

          // C. Draw Frozen Header Area selection
          const headerStartRowIndex = startRowIndex;
          const headerEndRowIndex = Math.min(endRowIndex, frozenRows - 1);
          const headerStartColumnIndex = Math.max(startColumnIndex, frozenColumns);
          const headerEndColumnIndex = endColumnIndex;

          if (headerStartRowIndex <= headerEndRowIndex && headerStartColumnIndex <= headerEndColumnIndex) {
            items.push([
              `header-${suffix}`,
              this.renderSelectionRegion(this.scrollOffset.left$, {
                startRowIndex: headerStartRowIndex,
                endRowIndex: headerEndRowIndex,
                startColumnIndex: headerStartColumnIndex,
                endColumnIndex: headerEndColumnIndex,
              }),
            ]);
          }

          // D. Draw Frozen Corner Area selection
          const cornerStartRowIndex = startRowIndex;
          const cornerEndRowIndex = Math.min(endRowIndex, frozenRows - 1);
          const cornerStartColumnIndex = startColumnIndex;
          const cornerEndColumnIndex = Math.min(endColumnIndex, frozenColumns - 1);

          if (cornerStartRowIndex <= cornerEndRowIndex && cornerStartColumnIndex <= cornerEndColumnIndex) {
            items.push([
              `corner-${suffix}`,
              this.renderSelectionRegion(of(1), {
                startRowIndex: cornerStartRowIndex,
                endRowIndex: cornerEndRowIndex,
                startColumnIndex: cornerStartColumnIndex,
                endColumnIndex: cornerEndColumnIndex,
              }),
            ]);
          }

          // ---- active cell ----

          if (rowIndex < frozenRows && columnIndex < frozenColumns) {
            items.push([`cornerActiveCell-${suffix}`, this.renderActiveCellMarker(of(1), activeCell)]);
          } else if (rowIndex < frozenRows) {
            items.push([
              `headerActiveCell-${suffix}`,
              this.renderActiveCellMarker(this.scrollOffset.left$, activeCell),
            ]);
          } else if (columnIndex < frozenColumns) {
            items.push([`sideActiveCell-${suffix}`, this.renderActiveCellMarker(this.scrollOffset.top$, activeCell)]);
          } else {
            items.push([
              `dataActiveCell-${suffix}`,
              this.renderActiveCellMarker(this.scrollOffset.offset$, activeCell),
            ]);
          }

          // ---- highlight ----

          // Collect indices for row/column header highlighting
          highlightedRows.push([startRowIndex, endRowIndex]);
          highlightedColumns.push([startColumnIndex, endColumnIndex]);
        });

        highlightedRows.merge();
        highlightedColumns.merge();

        const extraAttrs: Partial<Konva.RectConfig> = { stroke: 'transparent', strokeWidth: 0 };

        // Draw highlighting for column headers
        if (highlightedColumns.values.length > 0) {
          const frozenColumnMaxIndex = frozenColumns - 1;
          for (const [start, end] of highlightedColumns.values) {
            if (frozenColumnMaxIndex >= end) {
              items.push([
                `frozen-highlightedColumns-${start}-${end}`,
                this.renderSelectionRegion(
                  of(1),
                  { startColumnIndex: start, endColumnIndex: end, startRowIndex: 0, endRowIndex: 0 },
                  extraAttrs,
                ),
              ]);
            } else if (frozenColumnMaxIndex < start) {
              items.push([
                `data-highlightedColumns-${start}-${end}`,
                this.renderSelectionRegion(
                  this.scrollOffset.left$,
                  { startColumnIndex: start, endColumnIndex: end, startRowIndex: 0, endRowIndex: 0 },
                  extraAttrs,
                ),
              ]);
            } else {
              items.push(
                [
                  `split-frozen-highlightedColumns-${start}-${frozenColumnMaxIndex}`,
                  this.renderSelectionRegion(
                    of(1),
                    { startColumnIndex: start, endColumnIndex: frozenColumnMaxIndex, startRowIndex: 0, endRowIndex: 0 },
                    extraAttrs,
                  ),
                ],
                [
                  `split-data-highlightedColumns-${frozenColumns}-${end}`,
                  this.renderSelectionRegion(
                    this.scrollOffset.left$,
                    { startColumnIndex: frozenColumns, endColumnIndex: end, startRowIndex: 0, endRowIndex: 0 },
                    extraAttrs,
                  ),
                ],
              );
            }
          }
        }

        // Draw highlighting for row headers
        if (highlightedRows.values.length > 0) {
          const frozenRowMaxIndex = frozenRows - 1;
          for (const [start, end] of highlightedRows.values) {
            if (frozenRowMaxIndex >= end) {
              items.push([
                `frozen-highlightedRows-${start}-${end}`,
                this.renderSelectionRegion(
                  of(1),
                  { startRowIndex: start, endRowIndex: end, startColumnIndex: 0, endColumnIndex: 0 },
                  extraAttrs,
                ),
              ]);
            } else if (frozenRowMaxIndex < start) {
              items.push([
                `data-highlightedRows-${start}-${end}`,
                this.renderSelectionRegion(
                  this.scrollOffset.top$,
                  { startRowIndex: start, endRowIndex: end, startColumnIndex: 0, endColumnIndex: 0 },
                  extraAttrs,
                ),
              ]);
            } else {
              items.push([
                `split-frozen-highlightedRows-${start}-${frozenRowMaxIndex}`,
                this.renderSelectionRegion(
                  of(1),
                  { startRowIndex: start, endRowIndex: frozenRowMaxIndex, startColumnIndex: 0, endColumnIndex: 0 },
                  extraAttrs,
                ),
              ]);
              items.push([
                `split-data-highlightedRows-${frozenRows}-${end}`,
                this.renderSelectionRegion(
                  this.scrollOffset.top$,
                  { startRowIndex: frozenRows, endRowIndex: end, startColumnIndex: 0, endColumnIndex: 0 },
                  extraAttrs,
                ),
              ]);
            }
          }
        }

        this.subscriptions.update(items);
        return items.length;
      }),
    );
  }

  private renderSelectionRegion<T>(
    offset$: Observable<T>,
    region: IRegionInfo,
    extraRectAttrs?: Partial<Konva.RectConfig>,
  ): Observable<any> {
    return combineLatest([
      this.cellDimension.columnBoundary.accumulated.dimension.get$.pipe(
        map((get) => get(region.endColumnIndex)),
        distinctUntilChanged(),
      ),
      this.cellDimension.rowBoundary.accumulated.dimension.get$.pipe(
        map((get) => get(region.endRowIndex)),
        distinctUntilChanged(),
      ),
      offset$.pipe(
        switchMap(() =>
          this.cellDimension.getCellPoint$.pipe(
            take(1),
            map((getCellPoint) => {
              const leftTop = getCellPoint(region.startRowIndex, region.startColumnIndex);
              const rightBottom = getCellPoint(region.endRowIndex, region.endColumnIndex);
              return [leftTop, rightBottom] as const;
            }),
          ),
        ),
        distinctUntilChanged((x, y) => {
          return x[0].x === y[0].x && x[0].y === y[0].y && x[1].x === y[1].x && x[1].y === y[1].y;
        }),
      ),
    ]).pipe(
      map(([lastColumnWidth, lastRowHeight, [leftTop, rightBottom]]) => {
        const { x: left, y: top } = leftTop;
        const right = rightBottom.x + lastColumnWidth;
        const bottom = rightBottom.y + lastRowHeight;

        return { top, left, bottom, right };
      }),
      combineLatestWith(this.sheetDimension.visualSize$),
      switchMap(([{ top, left, bottom, right }, visual]) => {
        // Check if the selection is visible in the viewport (simple viewport clipping)
        if (right <= 0 || bottom <= 0 || left >= visual.width || top >= visual.height) return EMPTY;

        return this.selectionPool.getRect$.pipe(
          switchMap(
            (getRect) =>
              new Observable<Konva.Rect>((observer) => {
                const selectionRect = getRect();

                selectionRect.setAttrs({
                  x: left,
                  y: top,
                  width: right - left,
                  height: bottom - top,
                  ...extraRectAttrs,
                });
                observer.next(selectionRect);

                return () => {
                  this.selectionPool.disposeRect(selectionRect);
                };
              }),
          ),
        );
      }),
    );
  }

  private renderActiveCellMarker<T>(offset$: Observable<T>, activeCell: ILocation) {
    const { rowIndex, columnIndex } = activeCell;
    return offset$.pipe(
      switchMap(() =>
        this.cellDimension.getCellRectBox$.pipe(
          take(1),
          map((getCellRectBox) => {
            const { x, y, width, height } = getCellRectBox(rowIndex, columnIndex);
            return { top: y, left: x, bottom: y + height, right: x + width };
          }),
        ),
      ),
      distinctUntilChanged((x, y) => {
        return x.top === y.top && x.left === y.left && x.bottom === y.bottom && x.right === y.right;
      }),
      combineLatestWith(this.sheetDimension.visualSize$),
      switchMap(([{ top, left, bottom, right }, visual]) => {
        // Check if the selection is visible in the viewport (simple viewport clipping)
        if (right <= 0 || bottom <= 0 || left >= visual.width || top >= visual.height) return EMPTY;

        return this.activeCellMarkerPool.getRect$.pipe(
          switchMap(
            (getRect) =>
              new Observable<[Konva.Rect, Konva.Rect]>((observer) => {
                const activeCellRectEraser = getRect();
                const activeCellRectBorder = getRect();

                activeCellRectEraser.setAttrs({
                  x: left + 1,
                  y: top + 1,
                  width: right - left - 2,
                  height: bottom - top - 2,
                  fill: '#000000',
                  strokeWidth: 0,
                  globalCompositeOperation: 'destination-out',
                });
                activeCellRectEraser.moveToTop();

                activeCellRectBorder.setAttrs({
                  x: left,
                  y: top,
                  width: right - left,
                  height: bottom - top,
                });
                activeCellRectBorder.moveToTop();

                observer.next([activeCellRectEraser, activeCellRectBorder]);

                return () => {
                  this.activeCellMarkerPool.disposeRect(activeCellRectEraser);
                  this.activeCellMarkerPool.disposeRect(activeCellRectBorder);
                };
              }),
          ),
        );
      }),
    );
  }
}
