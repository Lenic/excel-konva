import type { ICellRegionOptions, ISelectedRange } from './types';

import { combineLatest, map, shareReplay, switchMap, take } from 'rxjs';

import { sheetVisualSize$ } from './utils/size';
import { SELECTION_FILL_COLOR, SELECTION_STROKE_COLOR } from './constants';
import { cellDimension, dataRegion, sheet } from './helpers';
import { backgroundLayer, getCellGroup$, selectionLayer } from './konva-items';
import { activeCellMarkerPool, cellPool, selectionPool } from './pools';

const state = {
  selectedRanges: [] as ISelectedRange[],
  startCell: null,
  isDragging: false, // 用于单元格选区拖拽
  animationFrameId: null,
};

const BORDER_STROKE = 2; // 选区边界统一使用 2px 边框

/**
 * 渲染所有选区和活动单元格标记。
 */
export const renderSelections$ = combineLatest([
  cellDimension.getCellPoint$.pipe(
    switchMap((getCellPoint) =>
      combineLatest([
        cellDimension.boundary.column.dimension.get$,
        sheet.frozenColumns$,
        cellDimension.boundary.row.dimension.get$,
        sheet.frozenRows$,
      ]).pipe(
        take(1),
        map((items) => [getCellPoint, ...items] as const),
      ),
    ),
  ),
  sheetVisualSize$,
]).pipe(
  map(([[getCellPoint, getColumnWidth, frozenColumns, getRowHeight, frozenRows], sheetVisualSize]) => {
    return function renderSelections() {
      selectionPool.reset();
      activeCellMarkerPool.reset();

      const { selectedRanges } = state;

      // 辅助函数：绘制一个子选区矩形
      const drawSubRange = (
        rowStartIndex: number,
        rowEndIndex: number,
        columnStartIndex: number,
        columnEndIndex: number,
        strokeWidth: number,
      ) => {
        if (rowStartIndex > rowEndIndex || columnStartIndex > columnEndIndex) return;

        // 1. 获取左上角 Konva 坐标 (起点位置)
        const topLeftPos = getCellPoint(rowStartIndex, columnStartIndex);

        // 2. 获取右下角 Konva 坐标 (使用 Boundary 函数)
        const rightBottomPos = getCellPoint(rowEndIndex + 1, columnEndIndex + 1);

        // 检查选区是否在视口内可见 (简单视口裁剪)
        if (
          rightBottomPos.x <= 0 ||
          rightBottomPos.y <= 0 ||
          topLeftPos.x >= sheetVisualSize.width ||
          topLeftPos.y >= sheetVisualSize.height
        ) {
          return;
        }

        const selectionRect = selectionPool.getRect();
        selectionRect.setAttrs({
          x: topLeftPos.x,
          y: topLeftPos.y,
          width: rightBottomPos.x - topLeftPos.x,
          height: rightBottomPos.y - topLeftPos.y,
          fill: SELECTION_FILL_COLOR,
          stroke: strokeWidth > 0 ? SELECTION_STROKE_COLOR : 'transparent',
          strokeWidth: strokeWidth,
          listening: false,
        });
      };

      // 收集需要高亮的行列头索引
      const highlightedColumns = new Set<number>();
      const highlightedRows = new Set<number>();

      // 绘制选中的区域
      selectedRanges.forEach((range) => {
        const { startRow, endRow, startCol, endCol } = range;

        // D. 绘制 Data Area 选区 (R_SCROLLABLE, C_SCROLLABLE)
        const dataStartRow = Math.max(startRow, frozenRows);
        const dataStartColumn = Math.max(startCol, frozenColumns);

        if (dataStartRow <= endRow && dataStartColumn <= endCol) {
          drawSubRange(dataStartRow, endRow, dataStartColumn, endCol, BORDER_STROKE);

          // 收集用于行列头高亮的索引
          for (let r = dataStartRow; r <= endRow; r++) highlightedRows.add(r);
          for (let c = dataStartColumn; c <= endCol; c++) highlightedColumns.add(c);
        }

        // C. 绘制 Frozen Side Area 选区 (R_SCROLLABLE, C_FROZEN)
        const sideStartRow = Math.max(startRow, frozenRows);
        const sideEndRow = endRow;
        const sideStartColumn = startCol;
        const sideEndColumn = Math.min(endCol, frozenColumns - 1);

        if (sideStartRow <= sideEndRow && sideStartColumn <= sideEndColumn) {
          drawSubRange(sideStartRow, sideEndRow, sideStartColumn, sideEndColumn, BORDER_STROKE);

          // 收集用于行列头高亮的索引
          for (let r = sideStartRow; r <= sideEndRow; r++) highlightedRows.add(r);
        }

        // B. 绘制 Frozen Header Area 选区 (R_FROZEN, C_SCROLLABLE)
        const headerStartRow = startRow;
        const headerEndRow = Math.min(endRow, frozenRows - 1);
        const headerStartColumn = Math.max(startCol, frozenColumns);
        const headerEndColumn = endCol;

        if (headerStartRow <= headerEndRow && headerStartColumn <= headerEndColumn) {
          drawSubRange(headerStartRow, headerEndRow, headerStartColumn, headerEndColumn, BORDER_STROKE);

          // 收集用于行列头高亮的索引
          for (let c = headerStartColumn; c <= headerEndColumn; c++) highlightedColumns.add(c);
        }

        // A. 绘制 Frozen Corner Area 选区 (R_FROZEN, C_FROZEN)
        const cornerStartRow = startRow;
        const cornerEndRow = Math.min(endRow, frozenRows - 1);
        const cornerStartColumn = startCol;
        const cornerEndColumn = Math.min(endCol, frozenColumns - 1);

        if (cornerStartRow <= cornerEndRow && cornerStartColumn <= cornerEndColumn) {
          drawSubRange(cornerStartRow, cornerEndRow, cornerStartColumn, cornerEndColumn, BORDER_STROKE);
        }

        // D. 绘制活动单元格标记 (Active Cell Marker)
        const activeRow = range.activeRow;
        const activeCol = range.activeCol;
        const activePos = getCellPoint(activeRow, activeCol);

        const markerRect = activeCellMarkerPool.getRect();
        markerRect.setAttrs({
          x: activePos.x,
          y: activePos.y,
          width: getColumnWidth(activeCol),
          height: getRowHeight(activeRow),
        });
      });

      // 绘制列头部分的高亮
      if (highlightedColumns.size > 0) {
        const sortedColumns = Array.from(highlightedColumns).sort((a, b) => a - b);
        // 绘制列头部分
        let startBatchCol = -1;
        for (let i = 0; i < sortedColumns.length; i++) {
          if (startBatchCol === -1) {
            startBatchCol = sortedColumns[i];
          }
          if (i === sortedColumns.length - 1 || sortedColumns[i + 1] !== sortedColumns[i] + 1) {
            // 绘制所有冻结行的列头高亮
            drawSubRange(
              0,
              0,
              startBatchCol,
              sortedColumns[i],
              0, // 无边框
            );
            startBatchCol = -1;
          }
        }
      }

      // 绘制行头部分的高亮
      if (highlightedRows.size > 0) {
        const sortedRows = Array.from(highlightedRows).sort((a, b) => a - b);
        // 绘制所有冻结列的行头高亮
        let startBatchRow = -1;
        for (let i = 0; i < sortedRows.length; i++) {
          if (startBatchRow === -1) {
            startBatchRow = sortedRows[i];
          }
          if (i === sortedRows.length - 1 || sortedRows[i + 1] !== sortedRows[i] + 1) {
            // 绘制选区中涉及的行范围，覆盖所有冻结列 (C0 到 frozenColumns-1)
            drawSubRange(
              startBatchRow,
              sortedRows[i],
              0,
              0,
              0, // 无边框
            );
            startBatchRow = -1;
          }
        }
      }

      selectionLayer.batchDraw();

      return selectedRanges.length;
    };
  }),
  shareReplay({ refCount: true, bufferSize: 1 }),
);

/**
 * 渲染所有可见单元格到对应的 Konva Group
 */
export const renderVisibleCells$ = combineLatest([
  getCellGroup$,
  cellDimension.getCellRectBox$,
  cellDimension.getCellData$,
]).pipe(
  switchMap(([getCellGroup, getCellRectBox, getCellData]) => {
    /**
     * 绘制目标单元格
     *
     * @param rowIndex - 单元格所在的行索引
     * @param columnIndex - 单元格所在的列索引
     * @param options - 单元格的设置信息
     */
    function renderCellRegion(rowIndex: number, columnIndex: number, options: ICellRegionOptions) {
      const group = getCellGroup(rowIndex, columnIndex);
      const { x, y, width, height } = getCellRectBox(rowIndex, columnIndex);

      const rect = cellPool.getRect();
      rect.setAttrs({
        ...options.rectAttrs,
        x,
        y,
        width,
        height,
      });
      if (rect.parent !== group) rect.moveTo(group);

      const text = cellPool.getText();
      text.setAttrs({
        ...options.textAttrs,
        x,
        y,
        width,
        height,
        text: getCellData(rowIndex, columnIndex),
      });
      if (text.parent !== group) text.moveTo(group);
    }

    return combineLatest([dataRegion.region$, sheet.frozenColumns$, sheet.frozenRows$]).pipe(
      take(1),
      map((items) => [renderCellRegion, ...items] as const),
    );
  }),
  map(([renderCellRegion, dataRegion, frozenColumns, frozenRows]) => {
    const { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } = dataRegion;

    cellPool.reset();

    // 渲染 Scrollable Data
    for (let r = startRowIndex; r < endRowIndex; r++) {
      for (let c = startColumnIndex; c < endColumnIndex; c++) {
        renderCellRegion(r, c, {
          rectAttrs: {
            fill: r % 2 === 0 ? '#ffffff' : '#f9f9f9',
            stroke: '#e8e8e8',
            strokeWidth: 0.5,
          },
          textAttrs: {
            fill: '#333333',
            fontSize: 12,
            align: 'left',
            padding: 8,
            ellipsis: true,
            wrap: 'none',
          },
        });
      }
    }

    // 渲染 Frozen Header
    for (let r = 0; r < frozenRows; r++) {
      for (let c = startColumnIndex; c < endColumnIndex; c++) {
        renderCellRegion(r, c, {
          rectAttrs: {
            fill: r === 0 ? '#f0f0f0' : r % 2 === 0 ? '#ffffff' : '#f9f9f9',
            stroke: '#cccccc',
            strokeWidth: 1,
          },
          textAttrs: {
            fill: '#000000',
            fontSize: r === 0 ? 14 : 12,
            align: r === 0 ? 'center' : 'left',
            padding: 8,
            ellipsis: true,
            wrap: 'none',
          },
        });
      }
    }

    // 渲染 Frozen Side
    for (let c = 0; c < frozenColumns; c++) {
      for (let r = startRowIndex; r < endRowIndex; r++) {
        renderCellRegion(r, c, {
          rectAttrs: {
            fill: c === 0 ? '#f0f0f0' : r % 2 === 0 ? '#ffffff' : '#f9f9f9',
            stroke: '#cccccc',
            strokeWidth: 1,
          },
          textAttrs: {
            fill: '#333333',
            fontSize: 12,
            align: c === 0 ? 'center' : 'left',
            padding: c === 0 ? 0 : 8,
            ellipsis: true,
            wrap: 'none',
          },
        });
      }
    }

    // 渲染 Corner
    for (let r = 0; r < frozenRows; r++) {
      for (let c = 0; c < frozenColumns; c++) {
        renderCellRegion(r, c, {
          rectAttrs: {
            fill: r === 0 && c === 0 ? '#e0e0e0' : '#f0f0f0',
            stroke: '#cccccc',
            strokeWidth: 1,
          },
          textAttrs: {
            fill: '#000000',
            fontSize: r === 0 ? 14 : 12,
            align: c === 0 ? 'center' : r === 0 ? 'center' : 'left',
            padding: c === 0 ? 0 : 8,
            ellipsis: true,
            wrap: 'none',
          },
        });
      }
    }

    backgroundLayer.batchDraw();

    return dataRegion;
  }),
  shareReplay({ refCount: true, bufferSize: 1 }),
);
