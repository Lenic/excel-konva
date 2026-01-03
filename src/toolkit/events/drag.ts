import type { ICellDimension, ISheetConfig } from '../helpers';
import type { ILocation } from '../types';
import type { ISelectionRegion, ISelectionStore, IStageDragListener, IStageMouseEvent } from './types';

import { EMPTY, finalize, map, of, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs';

import { stage } from '../konva-items';

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
      withLatestFrom(this.cellDimension.getCellLocation$),
      switchMap(([{ data }, getCellLocation]) => {
        const { activeCell, isMultiSelect } = data;
        if (!isMultiSelect) {
          this.store.clear();
        }

        const activeCellRowIndex = activeCell.rowIndex === 0 ? 1 : activeCell.rowIndex;
        const activeCellColumnIndex = activeCell.columnIndex === 0 ? 1 : activeCell.columnIndex;

        const selectionId = Date.now();
        const tmpActiveCell: ILocation = { rowIndex: activeCellRowIndex, columnIndex: activeCellColumnIndex };

        return this.events.mouseMove$.pipe(
          takeUntil(
            this.events.mouseUp$.pipe(
              tap(() => {
                this.store.check(selectionId);
              }),
              finalize(() => {
                stage.container().style.cursor = 'default';
              }),
            ),
          ),
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

            const selection: ISelectionRegion = {
              id: selectionId,
              region: {
                startRowIndex: minRowIndex,
                endRowIndex: maxRowIndex,
                startColumnIndex: minColumnIndex,
                endColumnIndex: maxColumnIndex,
              },
              activeCell: tmpActiveCell,
            };

            if (isMultiSelect) {
              this.store.update(selection);
            } else {
              this.store.override([selection]);
            }
          }),
        );
      }),
    );
  }
}
