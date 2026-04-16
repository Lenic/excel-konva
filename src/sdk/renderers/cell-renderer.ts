import type { IContentContext, IContentRenderer } from '../contents';
import type { ICellRange, ILocation, IRenderGroup } from '../core';
import type { EFreezeMode } from '../core';
import type { IDataManager } from '../data';
import type { ICellBoxManager, IViewport, IViewportManager } from '../ui';
import type Konva from 'konva';

import { combineLatestAll, combineLatestWith, filter, from, map, of, startWith, switchMap, tap } from 'rxjs';

import { DEFAULT_TEXT, HEADER_TEXT } from '../contents';
import { isCellInRange, isEqualLocation } from '../utils';

import { BaseRenderer } from './base-renderer';

export class CellRenderer extends BaseRenderer {
  private cellBox: ICellBoxManager;
  private dataManager: IDataManager;
  private renderers: Map<string | symbol, IContentRenderer>;

  constructor(
    cellBox: ICellBoxManager,
    viewportManager: IViewportManager,
    renderGroup: IRenderGroup,
    dataManager: IDataManager,
    renderers: Map<string | symbol, IContentRenderer>,
  ) {
    super(viewportManager, renderGroup);

    this.cellBox = cellBox;
    this.renderers = renderers;
    this.dataManager = dataManager;
  }

  protected buildSingleViewport(viewport: IViewport, group: Konva.Group, freezeMode: EFreezeMode) {
    return viewport.change$.pipe(
      filter((v) => v.type === 'range'),
      map((v) => v.current),
      startWith(viewport.range),
      map((range: ICellRange) => {
        const list: ILocation[] = [];
        for (let rowIndex = range.rowStartIndex; rowIndex <= range.rowEndIndex; rowIndex++) {
          for (let columnIndex = range.columnStartIndex; columnIndex <= range.columnEndIndex; columnIndex++) {
            list.push({ rowIndex, columnIndex });
          }
        }
        return list;
      }),
      this.transferSourceItems(
        (item) => `cell:${freezeMode}:${item.rowIndex}:${item.columnIndex}`,
        (x, y) => isEqualLocation(x, y),
        ({ rowIndex, columnIndex }) =>
          this.dataManager.change$.pipe(
            filter((patch) => isCellInRange(rowIndex, columnIndex, patch.range)),
            map(() => this.dataManager.get(rowIndex, columnIndex)),
            startWith(this.dataManager.get(rowIndex, columnIndex)),
            combineLatestWith(this.cellBox.getAbsoluteBox$(rowIndex, columnIndex)),
            switchMap(([content, cellBox]) => {
              const contentTypes = ['', rowIndex === 0 || columnIndex === 0 ? HEADER_TEXT : DEFAULT_TEXT];
              if (!(content === null || typeof content === 'string')) {
                contentTypes.push(...content.type);
              }

              const context: IContentContext = {
                rowIndex,
                columnIndex,
                content,
                freezeMode,
                viewport,
                group,
                cellBox,
              };

              return from(contentTypes).pipe(
                map((contentType) => this.renderers.get(contentType)?.render(context) ?? of(null)),
                combineLatestAll(),
                tap(() => this.renderGroup.layer.batchDraw()),
                this.withDestroy(),
              );
            }),
          ),
      ),
    );
  }
}
