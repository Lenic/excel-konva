import type { ICellDimension, IScrollOffset } from '../helpers';
import type { IStageEditListener, IStageMouseEvent } from './types';

import { EMPTY, filter, fromEvent, map, merge, of, skip, switchMap, take, withLatestFrom } from 'rxjs';

import { editor, rootElement } from '../core-elements';

import { EventListener } from './listener';

/**
 * Stage click listener
 */
export class StageEditListener extends EventListener implements IStageEditListener {
  events: IStageMouseEvent;
  cellDimension: ICellDimension;
  offset: IScrollOffset;

  /**
   * Constructor
   *
   * @param events stage mouse events
   * @param cellDimension cell dimension
   * @param offset scroll offset
   */
  constructor(events: IStageMouseEvent, cellDimension: ICellDimension, offset: IScrollOffset) {
    super();

    this.events = events;
    this.cellDimension = cellDimension;
    this.offset = offset;
  }

  protected build() {
    return this.dispositionSubject.pipe(
      filter(() => editor.classList.contains('hidden')),
      switchMap(() => this.events.dblclick$),
      withLatestFrom(
        this.cellDimension.getCellLocation$,
        this.cellDimension.getCellRectBox$,
        this.cellDimension.getCellData$,
      ),
      map(([e, getCellLocation, getCellRectBox, getCellData]) => {
        const rootRect = rootElement.getBoundingClientRect();
        const cell = getCellLocation(e.evt.clientX - rootRect.left, e.evt.clientY - rootRect.top);
        if (cell.rowIndex === 0 || cell.columnIndex === 0) return;

        const { x, y, width, height } = getCellRectBox(cell.rowIndex, cell.columnIndex);

        const containerRect = rootElement.getBoundingClientRect();
        const screenX = containerRect.left + x;
        const screenY = containerRect.top + y;

        editor.value = getCellData(cell.rowIndex, cell.columnIndex);
        editor.style.left = `${screenX}px`;
        editor.style.top = `${screenY}px`;
        editor.style.width = `${width + 2}px`;
        editor.style.height = `${height + 2}px`;
        editor.style.lineHeight = `${height - 2}px`;
        editor.classList.remove('hidden');
        editor.focus();
        editor.select();

        merge(
          this.offset.offset$.pipe(
            skip(1),
            map(() => false),
          ),
          fromEvent<KeyboardEvent>(editor, 'keydown').pipe(
            switchMap((e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                return of(true);
              } else if (e.key === 'Escape') {
                return of(false);
              }
              return EMPTY;
            }),
          ),
          fromEvent(editor, 'blur').pipe(map(() => true)),
        )
          .pipe(take(1))
          .subscribe((save) => {
            if (editor.classList.contains('hidden')) return;

            if (save) {
              const newText = editor.value;
              this.cellDimension.setCellData(cell.rowIndex, cell.columnIndex, newText || null);
            }

            editor.classList.add('hidden');
          });
      }),
    );
  }
}
