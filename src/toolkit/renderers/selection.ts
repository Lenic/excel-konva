import type { ISelectionStore } from '../events';
import type { ICellDimension, ISheetConfig, ISheetDimension } from '../helpers';
import type { IRectPool } from '../pools';
import type { IExcelEntrance, ILocation } from '../types';
import type { Observable } from 'rxjs';

import { combineLatest, distinctUntilChanged, map, switchMap, take } from 'rxjs';

import { ServiceLocator } from '../../container';

import { RenderListener } from './renderer';
import { IRangeCollection } from './types';

/**
 * Selection renderer
 */
export class SelectionListener extends RenderListener<number> {
  private config: ISheetConfig;
  private sheetDimension: ISheetDimension;
  private cellDimension: ICellDimension;
  private selectionStore: ISelectionStore;
  private excelEntrance: IExcelEntrance;
  private selectionPool: IRectPool;
  private activeCellMarkerPool: IRectPool;

  /**
   * Constructor
   * @param config Sheet config
   * @param sheetDimension Sheet dimension
   * @param cellDimension Cell dimension
   * @param selectionStore Selection store
   * @param excelEntrance Excel entrance
   * @param selectionPool Selection pool
   * @param activeCellMarkerPool Active cell marker pool
   */
  constructor(
    config: ISheetConfig,
    sheetDimension: ISheetDimension,
    cellDimension: ICellDimension,
    selectionStore: ISelectionStore,
    excelEntrance: IExcelEntrance,
    selectionPool: IRectPool,
    activeCellMarkerPool: IRectPool,
  ) {
    super();

    this.config = config;
    this.sheetDimension = sheetDimension;
    this.cellDimension = cellDimension;
    this.selectionStore = selectionStore;
    this.excelEntrance = excelEntrance;
    this.selectionPool = selectionPool;
    this.activeCellMarkerPool = activeCellMarkerPool;
  }

  protected build(): Observable<number> {
    return combineLatest([
      combineLatest([
        this.cellDimension.getCellPoint$.pipe(
          switchMap((getCellPoint) =>
            combineLatest([
              this.cellDimension.columnBoundary.accumulated.dimension.get$,
              this.cellDimension.rowBoundary.accumulated.dimension.get$,
            ]).pipe(
              take(1),
              map((items) => [getCellPoint, ...items] as const),
            ),
          ),
        ),
        this.sheetDimension.visualSize$,
        this.selectionPool.getRect$,
        this.activeCellMarkerPool.getRect$,
      ]).pipe(
        map(([[getCellPoint, getColumnWidth, getRowHeight], visual, getRect, getMarkerRect]) => {
          // Draw a sub-selection rectangle
          const drawSubRange = (
            rowStartIndex: number,
            rowEndIndex: number,
            columnStartIndex: number,
            columnEndIndex: number,
            strokeWidth?: number,
          ) => {
            if (rowStartIndex > rowEndIndex || columnStartIndex > columnEndIndex) return;

            // 1. Get top-left Konva coordinate (start position)
            const { x: left, y: top } = getCellPoint(rowStartIndex, columnStartIndex);
            // 2. Get bottom-right Konva coordinate
            const postion = getCellPoint(rowEndIndex, columnEndIndex);
            const right = postion.x + getColumnWidth(columnEndIndex);
            const bottom = postion.y + getRowHeight(rowEndIndex);

            // Check if the selection is visible in the viewport (simple viewport clipping)
            if (right <= 0 || bottom <= 0 || left >= visual.width || top >= visual.height) {
              return;
            }

            const selectionRect = getRect();
            selectionRect.setAttrs({
              x: left,
              y: top,
              width: right - left,
              height: bottom - top,
              stroke:
                typeof strokeWidth === 'number' && strokeWidth === 0
                  ? 'transparent'
                  : this.selectionPool.rectAttrs.stroke,
              strokeWidth,
            });
          };

          const drawActiveCell = (cell: ILocation) => {
            const { x, y } = getCellPoint(cell.rowIndex, cell.columnIndex);
            const markerRect = getMarkerRect();
            markerRect.setAttrs({
              x,
              y,
              width: getColumnWidth(cell.columnIndex),
              height: getRowHeight(cell.rowIndex),
            });
            markerRect.moveToTop();
          };

          return [drawSubRange, drawActiveCell] as const;
        }),
        switchMap((methods) =>
          combineLatest([
            this.config.get$('frozenColumns').pipe(take(1)),
            this.config.get$('frozenRows').pipe(take(1)),
          ]).pipe(map((items) => [...methods, ...items] as const)),
        ),
      ),
      this.selectionStore.list$.pipe(
        map((selectedRanges) => {
          const highlightedRows = ServiceLocator.current.get(IRangeCollection);
          const highlightedColumns = ServiceLocator.current.get(IRangeCollection);

          selectedRanges.forEach((range) => {
            const { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } = range.region;

            // Collect indices for row/column header highlighting
            highlightedRows.push([startRowIndex, endRowIndex]);
            highlightedColumns.push([startColumnIndex, endColumnIndex]);
          });

          highlightedRows.merge();
          highlightedColumns.merge();

          return [selectedRanges, highlightedRows, highlightedColumns] as const;
        }),
      ),
    ]).pipe(
      map(
        ([
          [drawSubRange, drawActiveCell, frozenColumns, frozenRows],
          [selectedRanges, highlightedRows, highlightedColumns],
        ]) => {
          this.selectionPool.reset();
          this.activeCellMarkerPool.reset();

          // Draw selected areas
          selectedRanges.forEach((range) => {
            const { region, activeCell } = range;
            const { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } = region;

            // A. Draw Data Area selection
            const dataStartRow = Math.max(startRowIndex, frozenRows);
            const dataStartColumn = Math.max(startColumnIndex, frozenColumns);

            if (dataStartRow <= endRowIndex && dataStartColumn <= endColumnIndex) {
              drawSubRange(dataStartRow, endRowIndex, dataStartColumn, endColumnIndex);
            }

            // B. Draw Frozen Side Area selection
            const sideStartRow = Math.max(startRowIndex, frozenRows);
            const sideEndRow = endRowIndex;
            const sideStartColumn = startColumnIndex;
            const sideEndColumn = Math.min(endColumnIndex, frozenColumns - 1);

            if (sideStartRow <= sideEndRow && sideStartColumn <= sideEndColumn) {
              drawSubRange(sideStartRow, sideEndRow, sideStartColumn, sideEndColumn);
            }

            // C. Draw Frozen Header Area selection
            const headerStartRow = startRowIndex;
            const headerEndRow = Math.min(endRowIndex, frozenRows - 1);
            const headerStartColumn = Math.max(startColumnIndex, frozenColumns);
            const headerEndColumn = endColumnIndex;

            if (headerStartRow <= headerEndRow && headerStartColumn <= headerEndColumn) {
              drawSubRange(headerStartRow, headerEndRow, headerStartColumn, headerEndColumn);
            }

            // D. Draw Frozen Corner Area selection
            const cornerStartRow = startRowIndex;
            const cornerEndRow = Math.min(endRowIndex, frozenRows - 1);
            const cornerStartColumn = startColumnIndex;
            const cornerEndColumn = Math.min(endColumnIndex, frozenColumns - 1);

            if (cornerStartRow <= cornerEndRow && cornerStartColumn <= cornerEndColumn) {
              drawSubRange(cornerStartRow, cornerEndRow, cornerStartColumn, cornerEndColumn);
            }

            // E. Draw Active Cell Marker
            drawActiveCell(activeCell);
          });

          // Draw highlighting for column headers
          if (highlightedColumns.values.length > 0) {
            const frozenColumnMaxIndex = frozenColumns - 1;
            for (const [start, end] of highlightedColumns.values) {
              if (frozenColumnMaxIndex < start || frozenColumnMaxIndex > end) {
                drawSubRange(0, 0, start, end, 0);
              } else {
                drawSubRange(0, 0, start, frozenColumnMaxIndex, 0);
                drawSubRange(0, 0, frozenColumnMaxIndex + 1, end, 0);
              }
            }
          }

          // Draw highlighting for row headers
          if (highlightedRows.values.length > 0) {
            const frozenRowMaxIndex = frozenRows - 1;
            for (const [start, end] of highlightedRows.values) {
              if (frozenRowMaxIndex < start || frozenRowMaxIndex > end) {
                drawSubRange(start, end, 0, 0, 0);
              } else {
                drawSubRange(start, frozenRowMaxIndex, 0, 0, 0);
                drawSubRange(frozenRowMaxIndex + 1, end, 0, 0, 0);
              }
            }
          }

          this.excelEntrance.selectionLayer.batchDraw();

          return selectedRanges.length;
        },
      ),
      distinctUntilChanged(),
    );
  }
}
