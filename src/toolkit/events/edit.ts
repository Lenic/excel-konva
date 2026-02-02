import type { IContentManager } from '../contents';
import type { ICellDimension, IScrollOffset, ISheetConfig } from '../helpers';
import type { IExcelEntrance } from '../types';
import type { IStageMouseEvent } from './types';

import { EMPTY, filter, finalize, switchMap, takeWhile, tap, withLatestFrom } from 'rxjs';

import { EEditStatus } from '../contents';
import { EFreezeMode } from '../types';

import { EventListener } from './listener';

/**
 * Stage click listener
 */
export class StageEditListener extends EventListener {
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
    return this.events.dblclick$.pipe(
      filter(() => this.status === EEditStatus.Normal),
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

        let freezeMode: EFreezeMode = EFreezeMode.NONE;
        if (cell.rowIndex < frozenRows && cell.columnIndex < frozenColumns) {
          freezeMode = EFreezeMode.BOTH;
        } else if (cell.rowIndex < frozenRows) {
          freezeMode = EFreezeMode.ROW;
        } else if (cell.columnIndex < frozenColumns) {
          freezeMode = EFreezeMode.COLUMN;
        }

        const content = getCellData(cell.rowIndex, cell.columnIndex);
        return this.getEditor(content)
          .edit(content, { rowIndex: cell.rowIndex, columnIndex: cell.columnIndex, freezeMode })
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
