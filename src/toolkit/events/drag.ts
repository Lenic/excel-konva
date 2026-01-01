import type { ICellDimension } from '../helpers';
import type { ISelectionRegion, ISelectionStore, IStageDragListener, IStageMouseEvent } from './types';

import { EMPTY, finalize, map, of, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs';

import { selectionLayer, stage } from '../konva-items';
import { activeCellMarkerPool, selectionPool } from '../pools';

import { EventListener } from './listener';
import { EMousedownTypes } from './types';

/**
 * Stage click listener
 */
export class StageDragListener extends EventListener implements IStageDragListener {
  store: ISelectionStore;
  events: IStageMouseEvent;
  cellDimension: ICellDimension;

  /**
   * Constructor
   * @param store selection store
   * @param events stage mouse events
   * @param cellDimension cell dimension
   */
  constructor(store: ISelectionStore, events: IStageMouseEvent, cellDimension: ICellDimension) {
    super();

    this.store = store;
    this.events = events;
    this.cellDimension = cellDimension;
  }

  protected build() {
    return this.dispositionSubject.pipe(
      switchMap(() =>
        this.events.typedMouseDownLeft$.pipe(
          switchMap((e) => (e.mousedownType === EMousedownTypes.SelectRegion ? of(e) : EMPTY)),
        ),
      ),
      withLatestFrom(
        this.cellDimension.getCellLocation$,
        this.cellDimension.getCellRectBox$,
        this.cellDimension.getCellPoint$,
      ),
      switchMap(([{ data }, getCellLocation, getCellRectBox, getCellPoint]) => {
        const { activeCell, isMultiSelect } = data;
        if (!isMultiSelect) {
          this.store.clear();
        }

        const activeCellBox = getCellRectBox(activeCell.rowIndex, activeCell.columnIndex);

        const dragActiveCell = activeCellMarkerPool.getRect();
        dragActiveCell.setAttrs({ ...activeCellBox, visible: true });

        const clear$ = this.events.mouseUp$.pipe(
          tap((ue) => {
            dragActiveCell.visible(false);

            const endCell = getCellLocation(ue.evt.clientX, ue.evt.clientY);
            const selection: ISelectionRegion = {
              region: {
                startRowIndex: Math.min(activeCell.rowIndex, endCell.rowIndex),
                endRowIndex: Math.max(activeCell.rowIndex, endCell.rowIndex),
                startColumnIndex: Math.min(activeCell.columnIndex, endCell.columnIndex),
                endColumnIndex: Math.max(activeCell.columnIndex, endCell.columnIndex),
              },
              activeCell,
            };

            if (isMultiSelect) {
              this.store.add(selection);
            } else {
              this.store.replace(selection);
            }
          }),
          finalize(() => {
            stage.container().style.cursor = 'default';
          }),
        );

        const dragRect = selectionPool.getRect();
        return this.events.mouseMove$.pipe(
          takeUntil(clear$),
          map((me) => {
            const currentCell = getCellLocation(me.evt.clientX, me.evt.clientY);
            const minRow = Math.min(activeCell.rowIndex, currentCell.rowIndex);
            const maxRow = Math.max(activeCell.rowIndex, currentCell.rowIndex);
            const minCol = Math.min(activeCell.columnIndex, currentCell.columnIndex);
            const maxCol = Math.max(activeCell.columnIndex, currentCell.columnIndex);
            const startPos = getCellRectBox(minRow, minCol);
            const endBoundaryPos = getCellPoint(maxRow + 1, maxCol + 1);

            // Draw the temporary drag rectangle
            dragRect.setAttrs({
              x: startPos.x,
              y: startPos.y,
              width: endBoundaryPos.x - startPos.x,
              height: endBoundaryPos.y - startPos.y,
            });
            dragActiveCell.moveToTop();

            selectionLayer.batchDraw();
          }),
        );
      }),
    );
  }
}
