import type { IRegionInfo, ISelectedRange } from './types';

import { combineLatest, distinctUntilChanged, map, shareReplay, withLatestFrom } from 'rxjs';

import { getCellData$, getCellPoint$, getCellRectBox$ } from './utils/cell';
import { getColumnLeft$ } from './utils/column';
import { getRowTop$ } from './utils/row';
import { getColumnWidth$, getRowHeight$, sheetVisualSize$ } from './utils/size';
import {
  columnCountSubject,
  frozenColumnsSubject,
  frozenRowsSubject,
  HEADER_COL_INDEX,
  HEADER_ROW_INDEX,
  rowCountSubject,
  SELECTION_FILL_COLOR,
  SELECTION_STROKE_COLOR,
} from './constants';
import { getCellGroup$, layer, selectionLayer } from './konva-items';
import { activeCellMarkerPool, cellPool, selectionPool } from './pools';

const state = {
  selectedRanges: [] as ISelectedRange[],
  startCell: null,
  isDragging: false, // 用于单元格选区拖拽
  animationFrameId: null,
};

const buffer = 5; // 缓冲单元格数量
const BORDER_STROKE = 2; // 选区边界统一使用 2px 边框

/**
 * 渲染所有选区和活动单元格标记。
 */
export const renderSelections$ = combineLatest([
  getCellPoint$.pipe(withLatestFrom(getColumnWidth$, getRowHeight$)),
  sheetVisualSize$,
  frozenRowsSubject,
  frozenColumnsSubject,
]).pipe(
  map(([[getCellPoint, getColumnWidth, getRowHeight], sheetVisualSize, frozenRows, frozenColumns]) => {
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
  combineLatest([getCellRectBox$, getColumnLeft$, getRowTop$]).pipe(distinctUntilChanged((x, y) => x[0] === y[0])),
  getCellGroup$,
  frozenColumnsSubject,
  frozenRowsSubject,
  columnCountSubject,
  rowCountSubject,
  getCellData$,
  sheetVisualSize$,
]).pipe(
  map(
    ([
      [getCellRectBox, getColumnLeft, getRowTop],
      getCellGroup,
      frozenColumns,
      frozenRows,
      columnCount,
      rowCount,
      getCellData,
      sheetVisualSize,
    ]) => {
      return function renderVisibleCells() {
        // 确定渲染范围
        const findVisibleRange = (
          getAccumulatedValue: (value: number) => number,
          frozenCount: number,
          maxCount: number,
          viewportSize: number,
        ) => {
          /**
           * 二分查找：找到第一个由于滚动而变得可见的元素
           *
           * - 我们要寻找第一个满足 `getAccumulatedValue(i + 1) > 0` 的 `i`
           * - `getAccumulatedValue(i)` 返回的是元素的起始位置 (Left/Top)
           * - 因为元素连续，`getAccumulatedValue(i + 1)` 即为元素 `i` 的结束位置 (Right/Bottom)
           */

          let low = frozenCount;
          let high = maxCount;
          let start = frozenCount;

          while (low < high) {
            const mid = (low + high) >> 1;
            // 获取 mid 元素的 **结束边界**
            const endEdge = getAccumulatedValue(mid + 1);

            if (endEdge > 0) {
              // 这个元素可能可见，尝试更前面的
              high = mid;
            } else {
              // 这个元素完全在视口左/上方，不可见
              low = mid + 1;
            }
          }
          start = low;

          /**
           * 二分查找：找到第一个离开视口的元素
           *
           * - 我们要寻找第一个满足 `getAccumulatedValue(i) > viewportSize` 的 `i`
           * - 即元素的起始位置已经超过了视口大小
           */

          low = start;
          high = maxCount;
          let end = maxCount;

          while (low < high) {
            const mid = (low + high) >> 1;
            const startEdge = getAccumulatedValue(mid);

            if (startEdge > viewportSize) {
              high = mid; // 这个元素已经在视口外了，尝试更前面的
            } else {
              low = mid + 1; // 这个元素还在视口内（或部分在），继续往后找
            }
          }
          end = low;

          // 应用缓冲区
          start = Math.max(frozenCount, start - buffer);
          end = Math.min(maxCount, end + buffer);

          return [start, end] as const;
        };

        const [dataStartRow, dataEndRow] = findVisibleRange(getRowTop, frozenRows, rowCount, sheetVisualSize.height);

        const [dataStartCol, dataEndCol] = findVisibleRange(
          getColumnLeft,
          frozenColumns,
          columnCount,
          sheetVisualSize.width,
        );

        cellPool.reset();

        // 渲染 Scrollable Data (R1+, C1+)
        for (let r = dataStartRow; r < dataEndRow; r++) {
          for (let c = dataStartCol; c < dataEndCol; c++) {
            const group = getCellGroup(r, c);
            const { x, y, width, height } = getCellRectBox(r, c);

            const rect = cellPool.getRect();
            rect.setAttrs({
              x,
              y,
              width,
              height,
              fill: r % 2 === 0 ? '#ffffff' : '#f9f9f9',
              stroke: '#e8e8e8',
              strokeWidth: 0.5,
            });
            if (rect.parent !== group) rect.moveTo(group);

            const text = cellPool.getText();
            text.setAttrs({
              x,
              y,
              width,
              height,
              text: getCellData(r, c),
              fill: '#333333',
              fontSize: 12,
              align: 'left',
              padding: 8,
              ellipsis: true,
              wrap: 'none',
            });
            if (text.parent !== group) text.moveTo(group);
          }
        }

        // 渲染 Frozen Header (R0, C1+) - FIX 1: 遍历所有冻结行
        if (frozenRows > 0) {
          for (let r = 0; r < frozenRows; r++) {
            // <--- 修复
            for (let c = dataStartCol; c < dataEndCol; c++) {
              const group = getCellGroup(r, c);
              const { x, y, width, height } = getCellRectBox(r, c);
              const rect = cellPool.getRect();
              rect.setAttrs({
                x,
                y,
                width,
                height,
                // R0 浅灰色，R1+ 交替色 (与 Scrollable Data 保持一致)
                fill: r === HEADER_ROW_INDEX ? '#f0f0f0' : r % 2 === 0 ? '#ffffff' : '#f9f9f9',
                stroke: '#cccccc',
                strokeWidth: 1,
              });
              if (rect.parent !== group) rect.moveTo(group);

              const text = cellPool.getText();
              text.setAttrs({
                x,
                y,
                width,
                height,
                text: getCellData(r, c),
                fill: '#000000',
                // R0 居中，R1+ 左对齐
                fontSize: r === HEADER_ROW_INDEX ? 14 : 12,
                align: r === HEADER_ROW_INDEX ? 'center' : 'left',
                padding: 8,
                ellipsis: true,
                wrap: 'none',
              });
              if (text.parent !== group) text.moveTo(group);
            }
          }
        }

        // 渲染 Frozen Side (R1+, C0) - FIX 2: 遍历所有冻结列
        if (frozenColumns > 0) {
          for (let c = 0; c < frozenColumns; c++) {
            // <--- 修复
            for (let r = dataStartRow; r < dataEndRow; r++) {
              const group = getCellGroup(r, c);
              const { x, y, width, height } = getCellRectBox(r, c);
              const rect = cellPool.getRect();
              rect.setAttrs({
                x,
                y,
                width,
                height,
                // C0 浅灰色，C1+ 交替色
                fill: c === HEADER_COL_INDEX ? '#f0f0f0' : r % 2 === 0 ? '#ffffff' : '#f9f9f9',
                stroke: '#cccccc', // 使用与表头一致的边框
                strokeWidth: 1,
              });
              if (rect.parent !== group) rect.moveTo(group);

              const text = cellPool.getText();
              text.setAttrs({
                x,
                y,
                width,
                height,
                text: getCellData(r, c),
                fill: '#333333',
                fontSize: 12,
                // C0 居中，C1+ 左对齐
                align: c === HEADER_COL_INDEX ? 'center' : 'left',
                padding: c === HEADER_COL_INDEX ? 0 : 8, // C0 列宽 40px，padding 设为 0 以便居中
                ellipsis: true,
                wrap: 'none',
              });
              if (text.parent !== group) text.moveTo(group);
            }
          }
        }

        // 渲染 Corner (R0, C0)
        if (frozenRows > 0 && frozenColumns > 0) {
          for (let r = 0; r < frozenRows; r++) {
            for (let c = 0; c < frozenColumns; c++) {
              const group = getCellGroup(r, c);
              const { x, y, width, height } = getCellRectBox(r, c);
              const rect = cellPool.getRect();
              rect.setAttrs({
                x,
                y,
                width,
                height,
                // Corner Cell R0, C0 独特背景色
                fill: r === HEADER_ROW_INDEX && c === HEADER_COL_INDEX ? '#e0e0e0' : '#f0f0f0',
                stroke: '#cccccc',
                strokeWidth: 1,
              });
              if (rect.parent !== group) rect.moveTo(group);

              const text = cellPool.getText();
              text.setAttrs({
                x,
                y,
                width,
                height,
                text: getCellData(r, c),
                fill: '#000000',
                // C0 列（行号列）所有行居中，其他列 R0 居中，R1+ 左对齐
                fontSize: r === HEADER_ROW_INDEX ? 14 : 12,
                align: c === HEADER_COL_INDEX ? 'center' : r === HEADER_ROW_INDEX ? 'center' : 'left',
                padding: c === HEADER_COL_INDEX ? 0 : 8, // C0 列宽 40px，padding 设为 0 以便居中
                ellipsis: true,
                wrap: 'none',
              });
              if (text.parent !== group) text.moveTo(group);
            }
          }
        }

        layer.batchDraw();

        // 更新状态信息
        const region: IRegionInfo = {
          startRow: dataStartRow,
          endRow: dataEndRow,
          startColumn: dataStartCol,
          endColumn: dataEndCol,
        };
        return region;
      };
    },
  ),
  shareReplay({ refCount: true, bufferSize: 1 }),
);
