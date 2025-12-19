import { auditTime } from 'rxjs';

import { columnCountSubject, frozenColumnsSubject, frozenRowsSubject, rowCountSubject } from './toolkit/constants';
import {
  renderedRangeColumn,
  renderedRangeRow,
  scrollXElement,
  scrollYElement,
  selectionCount,
  virtualContent,
} from './toolkit/core-elements';
import { renderSelections$, renderVisibleCells$ } from './toolkit/render';
import { scrollOffset$ } from './toolkit/utils/scroll';
import { sheetRealSize$ } from './toolkit/utils/size';

// --- 1. 配置常量与初始化 ---

// const MIN_CELL_WIDTH = 20;
// const MIN_CELL_HEIGHT = 15;
// const CELL_WIDTH = 100; // 默认数据单元格宽度 (C1+)
// const ROW_HEADER_WIDTH = 40; // 默认行头单元格宽度 (C0)
// const CELL_HEIGHT = 28; // 默认数据单元格高度 (R1+)
// const HEADER_HEIGHT = 30; // 默认表头高度 (R0)
// const RESIZE_TOLERANCE = 5; // 鼠标检测边界的容差 (像素)

rowCountSubject.subscribe((val) => {
  document.getElementById('total-rows')!.textContent = val.toLocaleString();
});

columnCountSubject.subscribe((val) => {
  document.getElementById('total-cols')!.textContent = val.toLocaleString();
});

frozenRowsSubject.subscribe((val) => {
  document.getElementById('frozen-rows-count')!.textContent = val.toLocaleString();
});

frozenColumnsSubject.subscribe((val) => {
  document.getElementById('frozen-cols-count')!.textContent = val.toLocaleString();
});

scrollOffset$.subscribe((val) => {
  scrollXElement.textContent = val.deltaX.toFixed(0);
  scrollYElement.textContent = val.deltaY.toFixed(0);
});

// 元素大小实时跟随变动
sheetRealSize$.subscribe((dimension) => {
  virtualContent.style.width = `${dimension.width}px`;
  virtualContent.style.height = `${dimension.height}px`;
});

renderSelections$.pipe(auditTime(16)).subscribe((render) => {
  const count = render();

  selectionCount.textContent = count.toLocaleString();
});
renderVisibleCells$.pipe(auditTime(16)).subscribe((render) => {
  const { startRow, endRow, startColumn, endColumn } = render();

  renderedRangeRow.textContent = `${startRow.toLocaleString()} - ${endRow.toLocaleString()}`;
  renderedRangeColumn.textContent = `${startColumn} - ${endColumn}`;
});

// doubleClick$.subscribe((render) => {
//   render();
// });

// // B. 鼠标拖拽选区逻辑
// const handleMouseMove = (e) => {
//   if (!state.isDragging || !state.startCell) return;

//   const currentCell = getCellLocation(e.evt.clientX, e.evt.clientY);

//   const minRow = Math.min(state.startCell.row, currentCell.row);
//   const maxRow = Math.max(state.startCell.row, currentCell.row);
//   const minCol = Math.min(state.startCell.col, currentCell.col);
//   const maxCol = Math.max(state.startCell.col, currentCell.col);

//   const startPos = getCellRect(minRow, minCol);
//   const endBoundaryPos = getCellBoundaryPoint(maxRow + 1, maxCol + 1);
//   const activePos = getCellRect(state.startCell.row, state.startCell.col);

//   // 绘制临时的拖拽矩形
//   dragRect.setAttrs({
//     x: startPos.x,
//     y: startPos.y,
//     width: endBoundaryPos.x - startPos.x,
//     height: endBoundaryPos.y - startPos.y,
//     visible: true,
//   });
//   temporaryActiveCellRect.setAttrs({
//     x: activePos.x,
//     y: activePos.y,
//     width: getColWidth(state.startCell.col),
//     height: getRowHeight(state.startCell.row),
//     visible: true,
//   });
//   selectionLayer.batchDraw();
// };

// const handleMouseUp = (e) => {
//   if (!state.isDragging) return;
//   state.isDragging = false;

//   stage.off('mousemove', handleMouseMove);
//   stage.off('mouseup', handleMouseUp);

//   // 隐藏临时的拖拽矩形
//   dragRect.visible(false);
//   temporaryActiveCellRect.visible(false);

//   if (!state.startCell) return;

//   const finalCell = getCellLocation(e.evt.clientX, e.evt.clientY);

//   const finalRange = {
//     startRow: Math.min(state.startCell.row, finalCell.row),
//     endRow: Math.max(state.startCell.row, finalCell.row),
//     startCol: Math.min(state.startCell.col, finalCell.col),
//     endCol: Math.max(state.startCell.col, finalCell.col),
//     activeRow: state.startCell.row,
//     activeCol: state.startCell.col,
//   };

//   const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;
//   let newSelectedRanges = isMultiSelect ? state.selectedRanges.slice() : [];

//   newSelectedRanges.push(finalRange);

//   state.selectedRanges = newSelectedRanges;
//   state.startCell = null;

//   // 绘制最终选区
//   renderAll();
// };

// C. 双击编辑功能
// const editorFinish$ = fromEvent<KeyboardEvent>(editor, 'keydown').pipe(
//   switchMap((e) => {
//     if (e.key === 'Enter' && !e.shiftKey) {
//       e.preventDefault();
//       return of(true);
//     } else if (e.key === 'Escape') {
//       return of(false);
//     }
//     return EMPTY;
//   }),
//   take(1)
// );
// stage$
//   .pipe(
//     switchMap((stage) =>
//       fromEventPattern<Konva.KonvaEventObject<MouseEvent>>(
//         (fn) => stage.on('dblclick', fn),
//         (fn) => stage.off('dblclick', fn)
//       )
//     ),
//     filter(() => editor.classList.contains('hidden')),
//     withLatestFrom(getCellLocation$, getCellRect$, getColWidth$, getRowHeight$, getCellData$)
//   )
//   .subscribe(([e, getCellLocation, getCellRect, getColWidth, getRowHeight, getCellData]) => {
//     const dblClickCell = getCellLocation(e.evt.clientX, e.evt.clientY);

//     // 仅允许编辑数据行 (R1+, C1+)
//     if (dblClickCell.row === HEADER_ROW_INDEX || dblClickCell.col === HEADER_COL_INDEX) return;

//     const cellKey = getCellKey(dblClickCell.row, dblClickCell.col);
//     const currentText = getCellData(dblClickCell.row, dblClickCell.col);

//     const konvaPos = getCellRect(dblClickCell.row, dblClickCell.col);

//     const containerRect = container.getBoundingClientRect();
//     const screenX = containerRect.left + konvaPos.x;
//     const screenY = containerRect.top + konvaPos.y;

//     editor.value = currentText;

//     const editorHeight = getRowHeight(dblClickCell.row);
//     const editorWidth = getColWidth(dblClickCell.col);

//     editor.style.left = `${screenX}px`;
//     editor.style.top = `${screenY}px`;
//     editor.style.width = `${editorWidth}px`;
//     editor.style.height = `${editorHeight}px`;
//     editor.style.lineHeight = `${editorHeight - 4}px`;

//     editor.classList.remove('hidden');
//     editor.focus();

//     let scrollSubscription: Subscription | null = scrollPoint$.pipe(skip(1), take(1)).subscribe(() => {
//       if (!editor.classList.contains('hidden')) {
//         editor.classList.add('hidden');
//       }
//     });

//     let subscription: Subscription | null = null;
//     const destroyEditor = (save = true) => {
//       if (editor.classList.contains('hidden')) return;

//       subscription?.unsubscribe();
//       subscription = null;
//       scrollSubscription?.unsubscribe();
//       scrollSubscription = null;

//       if (save) {
//         const newText = editor.value;
//         cellContentSubject.next([
//           cellKey,
//           newText === `R${dblClickCell.row.toLocaleString()}_C${dblClickCell.col}` ? null : newText,
//         ]);
//       }

//       editor.classList.add('hidden');
//     };

//     subscription = editorFinish$.subscribe(destroyEditor);

//     fromEvent(editor, 'blur')
//       .pipe(take(1))
//       .subscribe(() => {
//         destroyEditor(true);
//       });

//     editor.select();
//   });

// // E. 尺寸调整 (Resize) 逻辑
// function checkResizeBoundary(relX, relY) {
//   // 1. 检查列边界 (在 R0 区域内检测 C0, C1+)
//   if (relY < getRowHeight(HEADER_ROW_INDEX) + RESIZE_TOLERANCE) {
//     for (let c = 0; c < COL_COUNT; c++) {
//       // 使用 getCellBoundaryPoint 获取准确的边界位置
//       const boundaryPos = getCellBoundaryPoint(0, c + 1);
//       const boundaryX = boundaryPos.x;

//       if (Math.abs(relX - boundaryX) < RESIZE_TOLERANCE) {
//         return { type: 'col', index: c, pos: boundaryX };
//       }
//       if (boundaryX > VIEWPORT_WIDTH) break; // 超出视口
//     }
//   }

//   // 2. 检查行边界 (在 C0 区域内检测 R0, R1+)
//   if (relX < getColWidth(HEADER_COL_INDEX) + RESIZE_TOLERANCE) {
//     for (let r = 0; r < ROW_COUNT; r++) {
//       // 使用 getCellBoundaryPoint 获取准确的边界位置
//       const boundaryPos = getCellBoundaryPoint(r + 1, 0);
//       const boundaryY = boundaryPos.y;

//       if (Math.abs(relY - boundaryY) < RESIZE_TOLERANCE) {
//         return { type: 'row', index: r, pos: boundaryY };
//       }
//       if (boundaryY > VIEWPORT_HEIGHT) break; // 超出视口
//     }
//   }

//   return null;
// }

// const handleCursorMove = (e) => {
//   if (state.isDragging || resizeState.isResizing) return;

//   const containerRect = container.getBoundingClientRect();
//   const relX = e.evt.clientX - containerRect.left;
//   const relY = e.evt.clientY - containerRect.top;

//   const boundary = checkResizeBoundary(relX, relY);

//   if (boundary) {
//     stage.container().style.cursor = boundary.type === 'col' ? 'col-resize' : 'row-resize';
//   } else {
//     stage.container().style.cursor = 'default';
//   }
// };

// const handleResizeStart = (e) => {
//   if (e.evt.button !== 0) return;

//   const containerRect = container.getBoundingClientRect();
//   const relX = e.evt.clientX - containerRect.left;
//   const relY = e.evt.clientY - containerRect.top;

//   const boundary = checkResizeBoundary(relX, relY);

//   if (boundary) {
//     e.evt.preventDefault(); // 阻止默认的 mousedown 行为 (如选区)
//     resizeState.isResizing = true;
//     resizeState.type = boundary.type;
//     resizeState.index = boundary.index;
//     resizeState.startX = e.evt.clientX;
//     resizeState.startY = e.evt.clientY;

//     if (boundary.type === 'col') {
//       resizeState.startDimension = getColWidth(boundary.index);
//       resizeLine.points([boundary.pos, 0, boundary.pos, VIEWPORT_HEIGHT]);
//     } else {
//       resizeState.startDimension = getRowHeight(boundary.index);
//       resizeLine.points([0, boundary.pos, VIEWPORT_WIDTH, boundary.pos]);
//     }

//     resizeLine.visible(true);
//     selectionLayer.batchDraw();

//     stage.on('mousemove', handleResizeMove);
//     stage.on('mouseup', handleResizeEnd);
//     stage.off('mousemove', handleCursorMove); // 调整期间禁用光标检测
//   }
// };

// const handleResizeMove = (e) => {
//   if (!resizeState.isResizing) return;

//   if (resizeState.type === 'col') {
//     const dx = e.evt.clientX - resizeState.startX;
//     let newWidth = resizeState.startDimension + dx;
//     newWidth = Math.max(newWidth, MIN_CELL_WIDTH);

//     // 实时更新辅助线位置 (获取该列右边界的当前位置，然后加上尺寸变化)
//     const boundaryPos = getCellBoundaryPoint(0, resizeState.index + 1);
//     const currentBoundaryX = boundaryPos.x;
//     const widthDelta = newWidth - resizeState.startDimension;
//     const newX = currentBoundaryX + widthDelta;

//     resizeLine.points([newX, 0, newX, VIEWPORT_HEIGHT]);
//   } else if (resizeState.type === 'row') {
//     const dy = e.evt.clientY - resizeState.startY;
//     let newHeight = resizeState.startDimension + dy;
//     newHeight = Math.max(newHeight, MIN_CELL_HEIGHT);

//     // 实时更新辅助线位置 (获取该行下边界的当前位置，然后加上尺寸变化)
//     const boundaryPos = getCellBoundaryPoint(resizeState.index + 1, 0);
//     const currentBoundaryY = boundaryPos.y;
//     const heightDelta = newHeight - resizeState.startDimension;
//     const newY = currentBoundaryY + heightDelta;

//     resizeLine.points([0, newY, VIEWPORT_WIDTH, newY]);
//   }
//   selectionLayer.batchDraw();
// };

// const handleResizeEnd = (e) => {
//   if (!resizeState.isResizing) return;

//   resizeLine.visible(false);

//   if (resizeState.type === 'col') {
//     const dx = e.evt.clientX - resizeState.startX;
//     let newWidth = resizeState.startDimension + dx;
//     newWidth = Math.max(newWidth, MIN_CELL_WIDTH);
//     customColWidths[resizeState.index] = Math.round(newWidth);
//   } else if (resizeState.type === 'row') {
//     const dy = e.evt.clientY - resizeState.startY;
//     let newHeight = resizeState.startDimension + dy;
//     newHeight = Math.max(newHeight, MIN_CELL_HEIGHT);
//     customRowHeights[resizeState.index] = Math.round(newHeight);
//   }

//   resizeState.isResizing = false;
//   resizeState.type = null;

//   stage.container().style.cursor = 'default';
//   stage.off('mousemove', handleResizeMove);
//   stage.off('mouseup', handleResizeEnd);
//   stage.on('mousemove', handleCursorMove); // 恢复光标检测

//   // 重新计算总尺寸，更新滚动条，并重新渲染
//   calculateTotalDimensions();
//   renderAll();
// };

// // F. Mousedown 总控 (处理选区 和 启动尺寸调整)
// stage.on('mousedown', function (e) {
//   // 1. 检查是否启动尺寸调整
//   handleResizeStart(e);
//   if (resizeState.isResizing) {
//     return; // 正在调整尺寸，不进行选区
//   }

//   // 2. 检查是否点击了 Konva Stage 空白处 (非单元格)
//   if (e.target === stage) {
//     state.selectedRanges = [];
//     renderAll();
//     return;
//   }

//   // 3. 启动单元格选区
//   if (e.evt.button !== 0) return;

//   const startCell = getCellLocation(e.evt.clientX, e.evt.clientY);
//   const isMultiSelect = e.evt.ctrlKey || e.evt.metaKey;

//   const isRowHeaderClick = startCell.col === HEADER_COL_INDEX && startCell.row !== HEADER_ROW_INDEX;
//   const isColHeaderClick = startCell.row === HEADER_ROW_INDEX && startCell.col !== HEADER_COL_INDEX;
//   const isCornerClick = startCell.row === HEADER_ROW_INDEX && startCell.col === HEADER_COL_INDEX;

//   let finalRange = null;

//   if (isCornerClick) {
//     finalRange = {
//       startRow: 1,
//       endRow: ROW_COUNT - 1,
//       startCol: 1,
//       endCol: COL_COUNT - 1,
//       activeRow: 1,
//       activeCol: 1,
//     };
//   } else if (isRowHeaderClick) {
//     finalRange = {
//       startRow: startCell.row,
//       endRow: startCell.row,
//       startCol: 1,
//       endCol: COL_COUNT - 1,
//       activeRow: startCell.row,
//       activeCol: 1,
//     };
//   } else if (isColHeaderClick) {
//     finalRange = {
//       startRow: 1,
//       endRow: ROW_COUNT - 1,
//       startCol: startCell.col,
//       endCol: startCell.col,
//       activeRow: 1,
//       activeCol: startCell.col,
//     };
//   }

//   if (finalRange) {
//     // 点击了行列头
//     let newSelectedRanges = isMultiSelect ? state.selectedRanges.slice() : [];
//     newSelectedRanges.push(finalRange);
//     state.selectedRanges = newSelectedRanges;
//     renderAll();
//     return;
//   }

//   // 点击了数据单元格 (R1+, C1+)
//   state.isDragging = true;
//   state.startCell = startCell;

//   if (!isMultiSelect) {
//     state.selectedRanges = [];
//     selectionPool.reset();
//     activeCellMarkerPool.reset();
//     // selectionLayer.batchDraw(); // 在 handleMouseMove 中绘制
//   }

//   // 启动拖拽的绘制
//   handleMouseMove(e);

//   stage.on('mousemove', handleMouseMove);
//   stage.on('mouseup', handleMouseUp);
// });

// // 启用光标检测
// stage.on('mousemove', handleCursorMove);

// // --- 8. 初始启动 ---
// calculateTotalDimensions();
// renderAll();

// window.addEventListener('resize', () => {
//   VIEWPORT_WIDTH = container.clientWidth;
//   VIEWPORT_HEIGHT = container.clientHeight;
//   stage.width(VIEWPORT_WIDTH);
//   stage.height(VIEWPORT_HEIGHT);
//   handleScroll(); // 触发重绘
// });

// console.log(`Konva 虚拟化表格 (完整功能版) 已初始化。`);
