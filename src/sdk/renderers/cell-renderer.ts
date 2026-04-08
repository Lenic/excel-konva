import type { IContentRenderer } from '../contents';
import type { ICellRange, IKonvaItems } from '../core';
import type { EFreezeMode } from '../core';
import type { IDataManager } from '../data';
import type { ICellBoxManager, IViewportManager } from '../ui';
import type { Observable } from 'rxjs';

import { combineLatest, filter, map, of, startWith, switchMap, tap } from 'rxjs';

import { DEFAULT_TEXT, HEADER_TEXT } from '../contents';
import { isCellInRange } from '../utils';

import { BaseRenderer } from './base-renderer';

export class CellRenderer extends BaseRenderer {
  private cellBox: ICellBoxManager;
  private dataManager: IDataManager;
  private renderers: Map<string | symbol, IContentRenderer>;

  constructor(
    cellBox: ICellBoxManager,
    viewportManager: IViewportManager,
    konvaItems: IKonvaItems,
    dataManager: IDataManager,
    renderers: Map<string | symbol, IContentRenderer>,
  ) {
    super(viewportManager, konvaItems);

    this.cellBox = cellBox;
    this.renderers = renderers;
    this.dataManager = dataManager;
  }

  protected renderRegion(range: ICellRange, freezeMode: EFreezeMode): Record<string, Observable<any>> {
    const viewport = this.viewportManager[freezeMode];
    const group = this.konvaItems.background.groups[freezeMode];
    const render$Map: Record<string, Observable<any>> = {};
    for (let rowIndex = range.rowStartIndex; rowIndex <= range.rowEndIndex; rowIndex++) {
      for (let columnIndex = range.columnStartIndex; columnIndex <= range.columnEndIndex; columnIndex++) {
        render$Map[`render:${freezeMode}:${rowIndex}:${columnIndex}`] = this.dataManager.change$.pipe(
          filter((patch) => isCellInRange(rowIndex, columnIndex, patch.range)),
          map(() => this.dataManager.get(rowIndex, columnIndex)),
          startWith(this.dataManager.get(rowIndex, columnIndex)),
          switchMap((content) => {
            const contentTypes = ['', rowIndex === 0 || columnIndex === 0 ? HEADER_TEXT : DEFAULT_TEXT];
            if (!(content === null || typeof content === 'string')) {
              contentTypes.push(...content.type);
            }

            const partialContext = { rowIndex, columnIndex, content, freezeMode, viewport, group };
            return this.cellBox.change$.pipe(
              filter((patch) => {
                if (patch.type === 'reset') return true;
                if (patch.type === 'row' && patch.index <= rowIndex) return true;
                if (patch.type === 'column' && patch.index <= columnIndex) return true;

                return false;
              }),
              map(() => this.cellBox.getCellBox(rowIndex, columnIndex)),
              startWith(this.cellBox.getCellBox(rowIndex, columnIndex)),
              switchMap((cellBox) => {
                const renderObservables = contentTypes.map(
                  (contentType) => this.renderers.get(contentType)?.render({ ...partialContext, cellBox }) ?? of(null),
                );

                return combineLatest(renderObservables).pipe(
                  tap(() => {
                    this.konvaItems.background.layer.batchDraw();
                  }),
                );
              }),
              this.withDestroy(),
            );
          }),
        );
      }
    }
    return render$Map;
  }
}
