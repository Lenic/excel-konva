import type { IContentManager } from '../contents';
import type { ICellDimension, IScrollOffset, ISheetConfig } from '../helpers';
import type { IExcelEntrance } from '../types';
import type { IStageEditListener, IStageMouseEvent } from './types';

import { EMPTY, filter, finalize, switchMap, takeWhile, tap, withLatestFrom } from 'rxjs';

import { ECellFrozenType, EEditStatus } from '../contents';

import { EventListener } from './listener';

/**
 * Stage click listener
 */
export class StageEditListener extends EventListener implements IStageEditListener {
  private status: EEditStatus;

  events: IStageMouseEvent;
  cellDimension: ICellDimension;
  offset: IScrollOffset;
  excelEntrance: IExcelEntrance;
  editors: Map<string | symbol, IContentManager>;
  config: ISheetConfig;

  /**
   * Constructor
   *
   * @param events stage mouse events
   * @param cellDimension cell dimension
   * @param offset scroll offset
   * @param excelEntrance excel entrance
   * @param editors editors
   * @param config config
   */
  constructor(
    events: IStageMouseEvent,
    cellDimension: ICellDimension,
    offset: IScrollOffset,
    excelEntrance: IExcelEntrance,
    editors: Map<string | symbol, IContentManager>,
    config: ISheetConfig,
  ) {
    super();

    this.status = EEditStatus.Normal;

    this.events = events;
    this.cellDimension = cellDimension;
    this.offset = offset;
    this.excelEntrance = excelEntrance;
    this.editors = editors;
    this.config = config;
  }

  protected build() {
    return this.dispositionSubject.pipe(
      filter(() => this.status === EEditStatus.Normal),
      switchMap(() => this.events.dblclick$),
      withLatestFrom(
        this.cellDimension.getCellLocation$,
        this.cellDimension.getCellData$,
        this.config.get$('frozenColumns'),
        this.config.get$('frozenRows'),
      ),
      switchMap(([e, getCellLocation, getCellData, frozenColumns, frozenRows]) => {
        const rootRect = this.excelEntrance.rootElement.getBoundingClientRect();
        const cell = getCellLocation(e.evt.clientX - rootRect.left, e.evt.clientY - rootRect.top);
        if (cell.rowIndex === 0 || cell.columnIndex === 0) return EMPTY;

        let frozenType: ECellFrozenType = ECellFrozenType.None;
        if (cell.rowIndex < frozenRows && cell.columnIndex < frozenColumns) {
          frozenType = ECellFrozenType.Corner;
        } else if (cell.rowIndex < frozenRows) {
          frozenType = ECellFrozenType.Header;
        } else if (cell.columnIndex < frozenColumns) {
          frozenType = ECellFrozenType.Side;
        }

        const content = getCellData(cell.rowIndex, cell.columnIndex);
        return this.getEditor(content)
          .edit(content, { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex, frozenType })
          .pipe(
            takeWhile((status) => status !== EEditStatus.Saved && status !== EEditStatus.Canceled, true),
            tap((status) => {
              this.status = status;
            }),
            finalize(() => {
              this.status = EEditStatus.Normal;
            }),
          );
      }),
    );
  }

  private getEditor(cellContent: unknown): IContentManager {
    if (typeof cellContent === 'string') {
      return this.editors.get('')!;
    }

    return this.editors.get('')!;
  }
}
