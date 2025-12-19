import type Konva from 'konva';
import type { Subscription } from 'rxjs';

import {
  combineLatest,
  concatMap,
  EMPTY,
  filter,
  fromEvent,
  fromEventPattern,
  map,
  of,
  skip,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs';

import { HEADER_COL_INDEX, HEADER_ROW_INDEX } from '../constants';
import { container, editor } from '../core-elements';
import { stage } from '../konva-items';
import {
  getCellData$,
  getCellKey,
  getCellLocation$,
  getCellRect$,
  getColWidth$,
  getRowHeight$,
  scrollPoint$,
  setCellData,
} from '../utils';

// C.双击编辑功能;
const editorFinish$ = fromEvent<KeyboardEvent>(editor, 'keydown').pipe(
  switchMap((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      return of(true);
    } else if (e.key === 'Escape') {
      return of(false);
    }
    return EMPTY;
  }),
  take(1),
);

export const doubleClick$ = combineLatest([
  fromEventPattern<Konva.KonvaEventObject<MouseEvent>>(
    (fn) => stage.on('dblclick', fn),
    (fn) => stage.off('dblclick', fn),
  ),
  getCellLocation$,
]).pipe(
  filter(() => editor.classList.contains('hidden')),
  concatMap(([e, getCellLocation]) => {
    const cell = getCellLocation(e.evt.clientX, e.evt.clientY);
    // 仅允许编辑数据行 (R1+, C1+)
    return cell.row === HEADER_ROW_INDEX || cell.col === HEADER_COL_INDEX ? EMPTY : of(cell);
  }),
  withLatestFrom(getCellRect$, getColWidth$, getRowHeight$, getCellData$),
  map(([cell, getCellRect, getColWidth, getRowHeight, getCellData]) => {
    return function handleDoubleClick() {
      const cellKey = getCellKey(cell.row, cell.col);
      const currentText = getCellData(cell.row, cell.col);

      const konvaPos = getCellRect(cell.row, cell.col);

      const containerRect = container.getBoundingClientRect();
      const screenX = containerRect.left + konvaPos.x;
      const screenY = containerRect.top + konvaPos.y;

      editor.value = currentText;

      const editorHeight = getRowHeight(cell.row);
      const editorWidth = getColWidth(cell.col);

      editor.style.left = `${screenX}px`;
      editor.style.top = `${screenY}px`;
      editor.style.width = `${editorWidth}px`;
      editor.style.height = `${editorHeight}px`;
      editor.style.lineHeight = `${editorHeight - 4}px`;

      editor.classList.remove('hidden');
      editor.focus();

      let scrollSubscription: Subscription | null = scrollPoint$.pipe(skip(1), take(1)).subscribe(() => {
        if (!editor.classList.contains('hidden')) {
          editor.classList.add('hidden');
        }
      });

      let subscription: Subscription | null = null;
      const destroyEditor = (save = true) => {
        if (editor.classList.contains('hidden')) return;

        subscription?.unsubscribe();
        subscription = null;
        scrollSubscription?.unsubscribe();
        scrollSubscription = null;

        if (save) {
          const newText = editor.value;
          setCellData(cellKey, newText === `R${cell.row.toLocaleString()}_C${cell.col}` ? null : newText);
        }

        editor.classList.add('hidden');
      };

      subscription = editorFinish$.subscribe(destroyEditor);

      fromEvent(editor, 'blur')
        .pipe(take(1))
        .subscribe(() => {
          destroyEditor(true);
        });

      editor.select();
    };
  }),
);
