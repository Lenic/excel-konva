import type { ICellDimension, ISheetConfig } from '../helpers';
import type { ISelectionRegion, ISelectionStore, IStageDragListener, IStageMouseEvent } from './types';

import { EMPTY, finalize, map, of, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs';

import { selectionLayer, stage } from '../konva-items';
import { activeCellMarkerPool, selectionPool } from '../pools';

import { EventListener } from './listener';
import { EMousedownTypes } from './types';

/**
 * Stage drag listener
 */
export class StageDragListener extends EventListener implements IStageDragListener {
  config: ISheetConfig;
  store: ISelectionStore;
  events: IStageMouseEvent;
  cellDimension: ICellDimension;

  /**
   * Constructor
   * @param store selection store
   * @param events stage mouse events
   * @param cellDimension cell dimension
   */
  constructor(config: ISheetConfig, store: ISelectionStore, events: IStageMouseEvent, cellDimension: ICellDimension) {
    super();

    this.config = config;
    this.store = store;
    this.events = events;
    this.cellDimension = cellDimension;
  }

  protected build() {
    return this.dispositionSubject.pipe(
      switchMap(() =>
        this.events.typedMouseDownLeft$.pipe(
          switchMap((e) => (e.mousedownType === EMousedownTypes.SelectRegion ? of(e) : EMPTY)),
          switchMap((e) => (e.data.activeCell.rowIndex === 0 && e.data.activeCell.columnIndex === 0 ? EMPTY : of(e))),
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

        const activeCellRowIndex = activeCell.rowIndex === 0 ? 1 : activeCell.rowIndex;
        const activeCellColumnIndex = activeCell.columnIndex === 0 ? 1 : activeCell.columnIndex;

        const dragActiveCell = activeCellMarkerPool.getRect();
        dragActiveCell.setAttrs({ ...getCellRectBox(activeCellRowIndex, activeCellColumnIndex), visible: true });

        const clear$ = this.events.mouseUp$.pipe(
          tap((ue) => {
            dragActiveCell.visible(false);

            const endCell = getCellLocation(ue.evt.clientX, ue.evt.clientY);
            const endCellRowIndex = endCell.rowIndex === 0 ? 1 : endCell.rowIndex;
            const endCellColumnIndex = endCell.columnIndex === 0 ? 1 : endCell.columnIndex;

            const startRowIndex = Math.min(activeCellRowIndex, endCellRowIndex);
            const startColumnIndex = Math.min(activeCellColumnIndex, endCellColumnIndex);
            const endRowIndex =
              activeCell.rowIndex === 0 ? this.config.rowCount - 1 : Math.max(activeCellRowIndex, endCellRowIndex);
            const endColumnIndex =
              activeCell.columnIndex === 0
                ? this.config.columnCount - 1
                : Math.max(activeCellColumnIndex, endCellColumnIndex);
            const selection: ISelectionRegion = {
              region: { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex },
              activeCell: { rowIndex: activeCellRowIndex, columnIndex: activeCellColumnIndex },
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
            const currentCellRowIndex = currentCell.rowIndex === 0 ? 1 : currentCell.rowIndex;
            const currentCellColumnIndex = currentCell.columnIndex === 0 ? 1 : currentCell.columnIndex;

            const minRowIndex = Math.min(activeCellRowIndex, currentCellRowIndex);
            const maxRowIndex =
              currentCell.rowIndex === 0 ? this.config.rowCount - 1 : Math.max(activeCellRowIndex, currentCellRowIndex);
            const minColumnIndex = Math.min(activeCellColumnIndex, currentCellColumnIndex);
            const maxColumnIndex =
              currentCell.columnIndex === 0
                ? this.config.columnCount - 1
                : Math.max(activeCellColumnIndex, currentCellColumnIndex);
            const startPos = getCellRectBox(minRowIndex, minColumnIndex);
            const endBoundaryPos = getCellPoint(maxRowIndex + 1, maxColumnIndex + 1);

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
