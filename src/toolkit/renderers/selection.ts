import type { ISelectionStore } from '../events';
import type { ICellDimension, ISheetConfig, ISheetDimension } from '../helpers';
import type { ILocation } from '../types';
import type { Observable } from 'rxjs';

import { combineLatest, distinctUntilChanged, map, switchMap, take } from 'rxjs';

import { ServiceLocator } from '../../container';
import { BORDER_STROKE, SELECTION_FILL_COLOR, SELECTION_STROKE_COLOR } from '../constants';
import { selectionLayer } from '../konva-items';
import { activeCellMarkerPool, selectionPool } from '../pools';

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

  /**
   * Constructor
   * @param config Sheet config
   * @param sheetDimension Sheet dimension
   * @param cellDimension Cell dimension
   * @param selectionStore Selection store
   */
  constructor(
    config: ISheetConfig,
    sheetDimension: ISheetDimension,
    cellDimension: ICellDimension,
    selectionStore: ISelectionStore,
  ) {
    super();

    this.config = config;
    this.sheetDimension = sheetDimension;
    this.cellDimension = cellDimension;
    this.selectionStore = selectionStore;
  }

  protected build(): Observable<number> {
    return combineLatest([
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
    ]).pipe(
      map(([[getCellPoint, getColumnWidth, getRowHeight], visual]) => {
        // Draw a sub-selection rectangle
        function drawSubRange(
          rowStartIndex: number,
          rowEndIndex: number,
          columnStartIndex: number,
          columnEndIndex: number,
          strokeWidth: number,
        ) {
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

          const selectionRect = selectionPool.getRect();
          selectionRect.setAttrs({
            x: left,
            y: top,
            width: right - left,
            height: bottom - top,
            fill: SELECTION_FILL_COLOR,
            stroke: strokeWidth > 0 ? SELECTION_STROKE_COLOR : 'transparent',
            strokeWidth: strokeWidth,
            listening: false,
          });
        }

        function drawActiveCell(cell: ILocation) {
          const { x, y } = getCellPoint(cell.rowIndex, cell.columnIndex);
          const markerRect = activeCellMarkerPool.getRect();
          markerRect.setAttrs({
            x,
            y,
            width: getColumnWidth(cell.columnIndex),
            height: getRowHeight(cell.rowIndex),
          });
          markerRect.moveToTop();
        }

        return [drawSubRange, drawActiveCell] as const;
      }),
      switchMap((methods) =>
        combineLatest([
          this.config.frozenColumns$.pipe(take(1)),
          this.config.frozenRows$.pipe(take(1)),
          this.selectionStore.list$,
        ]).pipe(map((items) => [...methods, ...items] as const)),
      ),
      map(([drawSubRange, drawActiveCell, frozenColumns, frozenRows, selectedRanges]) => {
        selectionPool.reset();
        activeCellMarkerPool.reset();

        // Collect row/column header indices that need highlighting
        const highlightedRows = ServiceLocator.current.get(IRangeCollection);
        const highlightedColumns = ServiceLocator.current.get(IRangeCollection);

        // Draw selected areas
        selectedRanges.forEach((range) => {
          const { region, activeCell } = range;
          const { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } = region;

          // Collect indices for row/column header highlighting
          highlightedRows.push([startRowIndex, endRowIndex]);
          highlightedColumns.push([startColumnIndex, endColumnIndex]);

          // A. Draw Data Area selection
          const dataStartRow = Math.max(startRowIndex, frozenRows);
          const dataStartColumn = Math.max(startColumnIndex, frozenColumns);

          if (dataStartRow <= endRowIndex && dataStartColumn <= endColumnIndex) {
            drawSubRange(dataStartRow, endRowIndex, dataStartColumn, endColumnIndex, BORDER_STROKE);
          }

          // B. Draw Frozen Side Area selection
          const sideStartRow = Math.max(startRowIndex, frozenRows);
          const sideEndRow = endRowIndex;
          const sideStartColumn = startColumnIndex;
          const sideEndColumn = Math.min(endColumnIndex, frozenColumns - 1);

          if (sideStartRow <= sideEndRow && sideStartColumn <= sideEndColumn) {
            drawSubRange(sideStartRow, sideEndRow, sideStartColumn, sideEndColumn, BORDER_STROKE);
          }

          // C. Draw Frozen Header Area selection
          const headerStartRow = startRowIndex;
          const headerEndRow = Math.min(endRowIndex, frozenRows - 1);
          const headerStartColumn = Math.max(startColumnIndex, frozenColumns);
          const headerEndColumn = endColumnIndex;

          if (headerStartRow <= headerEndRow && headerStartColumn <= headerEndColumn) {
            drawSubRange(headerStartRow, headerEndRow, headerStartColumn, headerEndColumn, BORDER_STROKE);
          }

          // D. Draw Frozen Corner Area selection
          const cornerStartRow = startRowIndex;
          const cornerEndRow = Math.min(endRowIndex, frozenRows - 1);
          const cornerStartColumn = startColumnIndex;
          const cornerEndColumn = Math.min(endColumnIndex, frozenColumns - 1);

          if (cornerStartRow <= cornerEndRow && cornerStartColumn <= cornerEndColumn) {
            drawSubRange(cornerStartRow, cornerEndRow, cornerStartColumn, cornerEndColumn, BORDER_STROKE);
          }

          // E. Draw Active Cell Marker
          drawActiveCell(activeCell);
        });

        // Draw highlighting for column headers
        if (highlightedColumns.values.length > 0) {
          for (const [start, end] of highlightedColumns.values) {
            drawSubRange(0, 0, start, end, 0);
          }
        }

        // Draw highlighting for row headers
        if (highlightedRows.values.length > 0) {
          for (const [start, end] of highlightedRows.values) {
            drawSubRange(start, end, 0, 0, 0);
          }
        }

        selectionLayer.batchDraw();

        return selectedRanges.length;
      }),
      distinctUntilChanged(),
    );
  }
}
