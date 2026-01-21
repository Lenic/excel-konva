import type { ISelectionStore } from '../events';
import type { ICellDimension, IScrollOffset, ISheetConfig, ISheetDimension } from '../helpers';
import type { IRectPool } from '../pools';
import type { ILocation, IRegionInfo } from '../types';
import type Konva from 'konva';

import { combineLatestWith, concatMap, EMPTY, merge, Observable, of } from 'rxjs';
import { combineLatest, distinctUntilChanged, map, switchMap, take } from 'rxjs';

import { ServiceLocator } from '../../container';

import { RenderListener } from './renderer';
import { IRangeCollection } from './types';

interface MultipleRegion {
  dataList: IRegionInfo[];
  sideList: IRegionInfo[];
  headerList: IRegionInfo[];
  cornerList: IRegionInfo[];
  dataActiveCellList: ILocation[];
  sideActiveCellList: ILocation[];
  headerActiveCellList: ILocation[];
  cornerActiveCellList: ILocation[];
  highlightedRows: IRegionInfo[];
  highlightedColumns: IRegionInfo[];
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
  private scrollOffset$: IScrollOffset;

  /**
   * Constructor
   * @param config Sheet config
   * @param sheetDimension Sheet dimension
   * @param cellDimension Cell dimension
   * @param selectionStore Selection store
   * @param selectionPool Selection pool
   * @param activeCellMarkerPool Active cell marker pool
   */
  constructor(
    config: ISheetConfig,
    sheetDimension: ISheetDimension,
    cellDimension: ICellDimension,
    selectionStore: ISelectionStore,
    selectionPool: IRectPool,
    activeCellMarkerPool: IRectPool,
    scrollOffset$: IScrollOffset,
  ) {
    super();

    this.config = config;
    this.sheetDimension = sheetDimension;
    this.cellDimension = cellDimension;
    this.selectionStore = selectionStore;
    this.selectionPool = selectionPool;
    this.activeCellMarkerPool = activeCellMarkerPool;
    this.scrollOffset$ = scrollOffset$;
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

        selectedRanges.forEach(({ activeCell }) => {
          const { rowIndex, columnIndex } = activeCell;
          if (rowIndex < frozenRows && columnIndex < frozenColumns) {
            regionInfo.cornerActiveCellList.push(activeCell);
          } else if (rowIndex < frozenRows) {
            regionInfo.headerActiveCellList.push(activeCell);
          } else if (columnIndex < frozenColumns) {
            regionInfo.sideActiveCellList.push(activeCell);
          } else {
            regionInfo.dataActiveCellList.push(activeCell);
          }
        });

        selectedRanges.forEach((range) => {
          const { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } = range.region;

          // Collect indices for row/column header highlighting
          highlightedRows.push([startRowIndex, endRowIndex]);
          highlightedColumns.push([startColumnIndex, endColumnIndex]);

          // A. Draw Data Area selection
          const dataStartRow = Math.max(startRowIndex, frozenRows);
          const dataStartColumn = Math.max(startColumnIndex, frozenColumns);

          if (dataStartRow <= endRowIndex && dataStartColumn <= endColumnIndex) {
            regionInfo.dataList.push({
              startRowIndex: dataStartRow,
              endRowIndex,
              startColumnIndex: dataStartColumn,
              endColumnIndex,
            });
          }

          // B. Draw Frozen Side Area selection
          const sideStartRow = Math.max(startRowIndex, frozenRows);
          const sideEndRow = endRowIndex;
          const sideStartColumn = startColumnIndex;
          const sideEndColumn = Math.min(endColumnIndex, frozenColumns - 1);

          if (sideStartRow <= sideEndRow && sideStartColumn <= sideEndColumn) {
            regionInfo.sideList.push({
              startRowIndex: sideStartRow,
              endRowIndex: sideEndRow,
              startColumnIndex: sideStartColumn,
              endColumnIndex: sideEndColumn,
            });
          }

          // C. Draw Frozen Header Area selection
          const headerStartRow = startRowIndex;
          const headerEndRow = Math.min(endRowIndex, frozenRows - 1);
          const headerStartColumn = Math.max(startColumnIndex, frozenColumns);
          const headerEndColumn = endColumnIndex;

          if (headerStartRow <= headerEndRow && headerStartColumn <= headerEndColumn) {
            regionInfo.headerList.push({
              startRowIndex: headerStartRow,
              endRowIndex: headerEndRow,
              startColumnIndex: headerStartColumn,
              endColumnIndex: headerEndColumn,
            });
          }

          // D. Draw Frozen Corner Area selection
          const cornerStartRow = startRowIndex;
          const cornerEndRow = Math.min(endRowIndex, frozenRows - 1);
          const cornerStartColumn = startColumnIndex;
          const cornerEndColumn = Math.min(endColumnIndex, frozenColumns - 1);

          if (cornerStartRow <= cornerEndRow && cornerStartColumn <= cornerEndColumn) {
            regionInfo.cornerList.push({
              startRowIndex: cornerStartRow,
              endRowIndex: cornerEndRow,
              startColumnIndex: cornerStartColumn,
              endColumnIndex: cornerEndColumn,
            });
          }
        });

        highlightedRows.merge();
        highlightedColumns.merge();

        // Draw highlighting for column headers
        if (highlightedColumns.values.length > 0) {
          const frozenColumnMaxIndex = frozenColumns - 1;
          for (const [start, end] of highlightedColumns.values) {
            if (frozenColumnMaxIndex < start || frozenColumnMaxIndex >= end) {
              regionInfo.highlightedColumns.push({
                startColumnIndex: start,
                endColumnIndex: end,
                startRowIndex: 0,
                endRowIndex: 0,
              });
            } else {
              regionInfo.highlightedColumns.push({
                startColumnIndex: start,
                endColumnIndex: frozenColumnMaxIndex,
                startRowIndex: 0,
                endRowIndex: 0,
              });
              regionInfo.highlightedColumns.push({
                startColumnIndex: frozenColumnMaxIndex + 1,
                endColumnIndex: end,
                startRowIndex: 0,
                endRowIndex: 0,
              });
            }
          }
        }

        // Draw highlighting for row headers
        if (highlightedRows.values.length > 0) {
          const frozenRowMaxIndex = frozenRows - 1;
          for (const [start, end] of highlightedRows.values) {
            if (frozenRowMaxIndex < start || frozenRowMaxIndex >= end) {
              regionInfo.highlightedRows.push({
                startRowIndex: start,
                endRowIndex: end,
                startColumnIndex: 0,
                endColumnIndex: 0,
              });
            } else {
              regionInfo.highlightedRows.push({
                startRowIndex: start,
                endRowIndex: frozenRowMaxIndex,
                startColumnIndex: 0,
                endColumnIndex: 0,
              });
              regionInfo.highlightedRows.push({
                startRowIndex: frozenRowMaxIndex + 1,
                endRowIndex: end,
                startColumnIndex: 0,
                endColumnIndex: 0,
              });
            }
          }
        }

        const filterPerdicate = (region: IRegionInfo) =>
          region.startRowIndex <= region.endRowIndex && region.startColumnIndex <= region.endColumnIndex;
        regionInfo.dataList = regionInfo.dataList.filter(filterPerdicate);
        regionInfo.sideList = regionInfo.sideList.filter(filterPerdicate);
        regionInfo.headerList = regionInfo.headerList.filter(filterPerdicate);
        regionInfo.cornerList = regionInfo.cornerList.filter(filterPerdicate);

        return regionInfo;
      }),
      switchMap((regionInfo) =>
        merge(
          ...regionInfo.dataList.map((region) => this.renderSelectionRegion(this.scrollOffset$.offset$, region)),
          ...regionInfo.sideList.map((region) => this.renderSelectionRegion(this.scrollOffset$.top$, region)),
          ...regionInfo.headerList.map((region) => this.renderSelectionRegion(this.scrollOffset$.left$, region)),
          ...regionInfo.cornerList.map((region) => this.renderSelectionRegion(of(1), region)),
          ...regionInfo.dataActiveCellList.map((cell) => this.renderActiveCellMarker(this.scrollOffset$.offset$, cell)),
          ...regionInfo.sideActiveCellList.map((cell) => this.renderActiveCellMarker(this.scrollOffset$.top$, cell)),
          ...regionInfo.headerActiveCellList.map((cell) => this.renderActiveCellMarker(this.scrollOffset$.left$, cell)),
          ...regionInfo.cornerActiveCellList.map((cell) => this.renderActiveCellMarker(of(1), cell)),
          ...regionInfo.highlightedRows.map((region) =>
            this.renderSelectionRegion(this.scrollOffset$.top$, region, {
              stroke: 'transparent',
              strokeWidth: 0,
            }),
          ),
          ...regionInfo.highlightedColumns.map((region) =>
            this.renderSelectionRegion(this.scrollOffset$.left$, region, {
              stroke: 'transparent',
              strokeWidth: 0,
            }),
          ),
        ),
      ),
      concatMap(() => this.selectionStore.list$),
      map((items) => items.length),
      distinctUntilChanged(),
    );
  }

  private renderSelectionRegion<T>(
    offset$: Observable<T>,
    region: IRegionInfo,
    extraRectAttrs?: Partial<Konva.RectConfig>,
  ) {
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
