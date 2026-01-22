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

interface MultipleRegion {
  dataList: [key: string, item: IRegionInfo][];
  sideList: [key: string, item: IRegionInfo][];
  headerList: [key: string, item: IRegionInfo][];
  cornerList: [key: string, item: IRegionInfo][];
  dataActiveCellList: [key: string, item: ILocation][];
  sideActiveCellList: [key: string, item: ILocation][];
  headerActiveCellList: [key: string, item: ILocation][];
  cornerActiveCellList: [key: string, item: ILocation][];
  highlightedRows: [key: string, item: IRegionInfo][];
  highlightedColumns: [key: string, item: IRegionInfo][];
}

interface IRectWrapper {
  top: number;
  left: number;
  bottom: number;
  right: number;
}

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

        const regionInfo: MultipleRegion = {
          dataList: [],
          sideList: [],
          headerList: [],
          cornerList: [],
          dataActiveCellList: [],
          sideActiveCellList: [],
          headerActiveCellList: [],
          cornerActiveCellList: [],
          highlightedRows: [],
          highlightedColumns: [],
        };

        selectedRanges.forEach(({ activeCell, region }) => {
          const { rowIndex, columnIndex } = activeCell;
          const { startColumnIndex, startRowIndex, endColumnIndex, endRowIndex } = region;

          const suffix = `${startColumnIndex}-${startRowIndex}-${endColumnIndex}-${endRowIndex}-${rowIndex}-${columnIndex}`;

          // ---- active cell ----

          if (rowIndex < frozenRows && columnIndex < frozenColumns) {
            regionInfo.cornerActiveCellList.push([`cornerActiveCell-${suffix}`, activeCell]);
          } else if (rowIndex < frozenRows) {
            regionInfo.headerActiveCellList.push([`headerActiveCell-${suffix}`, activeCell]);
          } else if (columnIndex < frozenColumns) {
            regionInfo.sideActiveCellList.push([`sideActiveCell-${suffix}`, activeCell]);
          } else {
            regionInfo.dataActiveCellList.push([`dataActiveCell-${suffix}`, activeCell]);
          }

          // ---- region ----

          // Collect indices for row/column header highlighting
          highlightedRows.push([startRowIndex, endRowIndex]);
          highlightedColumns.push([startColumnIndex, endColumnIndex]);

          // A. Draw Data Area selection
          const dataStartRowIndex = Math.max(startRowIndex, frozenRows);
          const dataStartColumnIndex = Math.max(startColumnIndex, frozenColumns);

          if (dataStartRowIndex <= endRowIndex && dataStartColumnIndex <= endColumnIndex) {
            regionInfo.dataList.push([
              `data-${suffix}`,
              {
                startRowIndex: dataStartRowIndex,
                endRowIndex,
                startColumnIndex: dataStartColumnIndex,
                endColumnIndex,
              },
            ]);
          }

          // B. Draw Frozen Side Area selection
          const sideStartRowIndex = Math.max(startRowIndex, frozenRows);
          const sideEndRowIndex = endRowIndex;
          const sideStartColumnIndex = startColumnIndex;
          const sideEndColumnIndex = Math.min(endColumnIndex, frozenColumns - 1);

          if (sideStartRowIndex <= sideEndRowIndex && sideStartColumnIndex <= sideEndColumnIndex) {
            regionInfo.sideList.push([
              `side-${suffix}`,
              {
                startRowIndex: sideStartRowIndex,
                endRowIndex: sideEndRowIndex,
                startColumnIndex: sideStartColumnIndex,
                endColumnIndex: sideEndColumnIndex,
              },
            ]);
          }

          // C. Draw Frozen Header Area selection
          const headerStartRowIndex = startRowIndex;
          const headerEndRowIndex = Math.min(endRowIndex, frozenRows - 1);
          const headerStartColumnIndex = Math.max(startColumnIndex, frozenColumns);
          const headerEndColumnIndex = endColumnIndex;

          if (headerStartRowIndex <= headerEndRowIndex && headerStartColumnIndex <= headerEndColumnIndex) {
            regionInfo.headerList.push([
              `header-${suffix}`,
              {
                startRowIndex: headerStartRowIndex,
                endRowIndex: headerEndRowIndex,
                startColumnIndex: headerStartColumnIndex,
                endColumnIndex: headerEndColumnIndex,
              },
            ]);
          }

          // D. Draw Frozen Corner Area selection
          const cornerStartRowIndex = startRowIndex;
          const cornerEndRowIndex = Math.min(endRowIndex, frozenRows - 1);
          const cornerStartColumnIndex = startColumnIndex;
          const cornerEndColumnIndex = Math.min(endColumnIndex, frozenColumns - 1);

          if (cornerStartRowIndex <= cornerEndRowIndex && cornerStartColumnIndex <= cornerEndColumnIndex) {
            regionInfo.cornerList.push([
              `corner-${suffix}`,
              {
                startRowIndex: cornerStartRowIndex,
                endRowIndex: cornerEndRowIndex,
                startColumnIndex: cornerStartColumnIndex,
                endColumnIndex: cornerEndColumnIndex,
              },
            ]);
          }
        });

        highlightedRows.merge();
        highlightedColumns.merge();

        // Draw highlighting for column headers
        if (highlightedColumns.values.length > 0) {
          const frozenColumnMaxIndex = frozenColumns - 1;
          for (const [start, end] of highlightedColumns.values) {
            if (frozenColumnMaxIndex < start || frozenColumnMaxIndex >= end) {
              regionInfo.highlightedColumns.push([
                `highlightedColumns-${start}-${end}`,
                {
                  startColumnIndex: start,
                  endColumnIndex: end,
                  startRowIndex: 0,
                  endRowIndex: 0,
                },
              ]);
            } else {
              regionInfo.highlightedColumns.push([
                `highlightedColumns-${start}-${frozenColumnMaxIndex}`,
                {
                  startColumnIndex: start,
                  endColumnIndex: frozenColumnMaxIndex,
                  startRowIndex: 0,
                  endRowIndex: 0,
                },
              ]);
              regionInfo.highlightedColumns.push([
                `highlightedColumns-${frozenColumnMaxIndex + 1}-${end}`,
                {
                  startColumnIndex: frozenColumnMaxIndex + 1,
                  endColumnIndex: end,
                  startRowIndex: 0,
                  endRowIndex: 0,
                },
              ]);
            }
          }
        }

        // Draw highlighting for row headers
        if (highlightedRows.values.length > 0) {
          const frozenRowMaxIndex = frozenRows - 1;
          for (const [start, end] of highlightedRows.values) {
            if (frozenRowMaxIndex < start || frozenRowMaxIndex >= end) {
              regionInfo.highlightedRows.push([
                `highlightedRows-${start}-${end}`,
                {
                  startRowIndex: start,
                  endRowIndex: end,
                  startColumnIndex: 0,
                  endColumnIndex: 0,
                },
              ]);
            } else {
              regionInfo.highlightedRows.push([
                `highlightedRows-${start}-${frozenRowMaxIndex}`,
                {
                  startRowIndex: start,
                  endRowIndex: frozenRowMaxIndex,
                  startColumnIndex: 0,
                  endColumnIndex: 0,
                },
              ]);
              regionInfo.highlightedRows.push([
                `highlightedRows-${frozenRowMaxIndex + 1}-${end}`,
                {
                  startRowIndex: frozenRowMaxIndex + 1,
                  endRowIndex: end,
                  startColumnIndex: 0,
                  endColumnIndex: 0,
                },
              ]);
            }
          }
        }

        const items: [key: string, item: Observable<any>][] = [];

        regionInfo.dataList.forEach(([key, region]) => {
          items.push([key, this.renderSelectionRegion(this.scrollOffset.offset$, region)]);
        });

        regionInfo.sideList.forEach(([key, region]) => {
          items.push([key, this.renderSelectionRegion(this.scrollOffset.top$, region)]);
        });

        regionInfo.headerList.forEach(([key, region]) => {
          items.push([key, this.renderSelectionRegion(this.scrollOffset.left$, region)]);
        });

        regionInfo.cornerList.forEach(([key, region]) => {
          items.push([key, this.renderSelectionRegion(of(1), region)]);
        });

        regionInfo.dataActiveCellList.forEach(([key, cell]) => {
          items.push([key, this.renderActiveCellMarker(this.scrollOffset.offset$, cell)]);
        });

        regionInfo.sideActiveCellList.forEach(([key, cell]) => {
          items.push([key, this.renderActiveCellMarker(this.scrollOffset.top$, cell)]);
        });

        regionInfo.headerActiveCellList.forEach(([key, cell]) => {
          items.push([key, this.renderActiveCellMarker(this.scrollOffset.left$, cell)]);
        });

        regionInfo.cornerActiveCellList.forEach(([key, cell]) => {
          items.push([key, this.renderActiveCellMarker(of(1), cell)]);
        });

        regionInfo.highlightedRows.forEach(([key, region]) => {
          items.push([
            key,
            this.renderSelectionRegion(this.scrollOffset.top$, region, {
              stroke: 'transparent',
              strokeWidth: 0,
            }),
          ]);
        });

        regionInfo.highlightedColumns.forEach(([key, region]) => {
          items.push([
            key,
            this.renderSelectionRegion(this.scrollOffset.left$, region, {
              stroke: 'transparent',
              strokeWidth: 0,
            }),
          ]);
        });

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

        return { top, left, bottom, right } as IRectWrapper;
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
            return { top: y, left: x, bottom: y + height, right: x + width } as IRectWrapper;
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
              new Observable<Konva.Rect>((observer) => {
                const activeCellRect = getRect();

                activeCellRect.setAttrs({
                  x: left,
                  y: top,
                  width: right - left,
                  height: bottom - top,
                });
                activeCellRect.moveToTop();

                observer.next(activeCellRect);

                return () => {
                  this.activeCellMarkerPool.disposeRect(activeCellRect);
                };
              }),
          ),
        );
      }),
    );
  }
}
