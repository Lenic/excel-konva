import Konva from 'konva';
import { combineLatest, filter, from, fromEventPattern, switchMap } from 'rxjs';

import { HEADER_COL_INDEX, HEADER_ROW_INDEX } from '../constants';
import { stage } from '../konva-items';
import { getCellLocation$ } from '../utils';

import { mousedown$ } from './utils';

// B. 鼠标拖拽选区逻辑
combineLatest([mousedown$, getCellLocation$]).pipe(
  filter((e) => e.evt.button === 0),
  switchMap(([e, getCellLocation]) => {
    const startCell = getCellLocation(e.evt.clientX, e.evt.clientY);
    const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;

    const isRowHeaderClick = startCell.col === HEADER_COL_INDEX && startCell.row !== HEADER_ROW_INDEX;
    const isColHeaderClick = startCell.row === HEADER_ROW_INDEX && startCell.col !== HEADER_COL_INDEX;
    const isCornerClick = startCell.row === HEADER_ROW_INDEX && startCell.col === HEADER_COL_INDEX;

    let finalRange = null;

    if (isCornerClick) {
      finalRange = {
        startRow: 1,
        endRow: ROW_COUNT - 1,
        startCol: 1,
        endCol: COL_COUNT - 1,
        activeRow: 1,
        activeCol: 1,
      };
    } else if (isRowHeaderClick) {
      finalRange = {
        startRow: startCell.row,
        endRow: startCell.row,
        startCol: 1,
        endCol: COL_COUNT - 1,
        activeRow: startCell.row,
        activeCol: 1,
      };
    } else if (isColHeaderClick) {
      finalRange = {
        startRow: 1,
        endRow: ROW_COUNT - 1,
        startCol: startCell.col,
        endCol: startCell.col,
        activeRow: 1,
        activeCol: startCell.col,
      };
    }
  }),
);

const handleMouseMove = (e) => {
  if (!state.isDragging || !state.startCell) return;

  const currentCell = getCellLocation(e.evt.clientX, e.evt.clientY);

  const minRow = Math.min(state.startCell.row, currentCell.row);
  const maxRow = Math.max(state.startCell.row, currentCell.row);
  const minCol = Math.min(state.startCell.col, currentCell.col);
  const maxCol = Math.max(state.startCell.col, currentCell.col);

  const startPos = getCellRect(minRow, minCol);
  const endBoundaryPos = getCellBoundaryPoint(maxRow + 1, maxCol + 1);
  const activePos = getCellRect(state.startCell.row, state.startCell.col);

  // 绘制临时的拖拽矩形
  dragRect.setAttrs({
    x: startPos.x,
    y: startPos.y,
    width: endBoundaryPos.x - startPos.x,
    height: endBoundaryPos.y - startPos.y,
    visible: true,
  });
  temporaryActiveCellRect.setAttrs({
    x: activePos.x,
    y: activePos.y,
    width: getColWidth(state.startCell.col),
    height: getRowHeight(state.startCell.row),
    visible: true,
  });
  selectionLayer.batchDraw();
};

const handleMouseUp = (e) => {
  if (!state.isDragging) return;
  state.isDragging = false;

  stage.off('mousemove', handleMouseMove);
  stage.off('mouseup', handleMouseUp);

  // 隐藏临时的拖拽矩形
  dragRect.visible(false);
  temporaryActiveCellRect.visible(false);

  if (!state.startCell) return;

  const finalCell = getCellLocation(e.evt.clientX, e.evt.clientY);

  const finalRange = {
    startRow: Math.min(state.startCell.row, finalCell.row),
    endRow: Math.max(state.startCell.row, finalCell.row),
    startCol: Math.min(state.startCell.col, finalCell.col),
    endCol: Math.max(state.startCell.col, finalCell.col),
    activeRow: state.startCell.row,
    activeCol: state.startCell.col,
  };

  const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
  const newSelectedRanges = isMultiSelect ? state.selectedRanges.slice() : [];

  newSelectedRanges.push(finalRange);

  state.selectedRanges = newSelectedRanges;
  state.startCell = null;

  // 绘制最终选区
  renderAll();
};

// // 启用光标检测
stage.on('mousemove', handleCursorMove);
