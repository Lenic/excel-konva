import type { IContentManager, IContentRendererContext } from '../contents';
import type { ICellDimension, IDataRegion, ISheetConfig } from '../helpers';
import type { IRegionInfo } from '../types';
import type Konva from 'konva';
import type { Observable, Subscription } from 'rxjs';

import { combineLatest, distinctUntilChanged, map, switchMap } from 'rxjs';

import { ECellFrozenType } from '../contents';

import { RenderListener } from './renderer';

export class CellListener extends RenderListener<IRegionInfo> {
  private layer: Konva.Layer;
  private config: ISheetConfig;
  private dataRegion: IDataRegion;
  private cellDimension: ICellDimension;
  private renderers: Map<string | symbol, IContentManager>;
  private subscriptions = new Map<string, Subscription>();

  constructor(
    layer: Konva.Layer,
    config: ISheetConfig,
    dataRegion: IDataRegion,
    cellDimension: ICellDimension,
    renderers: Map<string | symbol, IContentManager>,
  ) {
    super();

    this.layer = layer;
    this.config = config;
    this.dataRegion = dataRegion;
    this.cellDimension = cellDimension;
    this.renderers = renderers;
  }

  protected build(): Observable<IRegionInfo> {
    return combineLatest([
      this.dataRegion.region$,
      this.config.get$('frozenColumns'),
      this.config.get$('frozenRows'),
    ]).pipe(
      map(([dataRegion, frozenColumns, frozenRows]) => {
        const { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } = dataRegion;

        const items: IContentRendererContext[] = [];

        // Render Scrollable Data
        for (let r = startRowIndex; r < endRowIndex; r++) {
          for (let c = startColumnIndex; c < endColumnIndex; c++) {
            items.push({ rowIndex: r, columnIndex: c, frozenType: ECellFrozenType.None });
          }
        }

        // Render Frozen Header
        for (let r = 0; r < frozenRows; r++) {
          for (let c = startColumnIndex; c < endColumnIndex; c++) {
            items.push({ rowIndex: r, columnIndex: c, frozenType: ECellFrozenType.Header });
          }
        }

        // Render Frozen Side
        for (let c = 0; c < frozenColumns; c++) {
          for (let r = startRowIndex; r < endRowIndex; r++) {
            items.push({ rowIndex: r, columnIndex: c, frozenType: ECellFrozenType.Side });
          }
        }

        // Render Corner
        for (let r = 0; r < frozenRows; r++) {
          for (let c = 0; c < frozenColumns; c++) {
            items.push({ rowIndex: r, columnIndex: c, frozenType: ECellFrozenType.Corner });
          }
        }

        const currentKeys = new Set<string>();

        // 1. Add new subscriptions
        for (const item of items) {
          const key = `${item.rowIndex}:${item.columnIndex}:${item.frozenType}`;
          currentKeys.add(key);

          // New → create subscription
          if (!this.subscriptions.has(key)) {
            const subscription = this.cellDimension.getCellData$
              .pipe(
                map((getData) => getData(item.rowIndex, item.columnIndex)),
                distinctUntilChanged(),
                switchMap((cellContent) => this.getRenderer(cellContent).render(cellContent, item)),
              )
              .subscribe();
            this.subscriptions.set(key, subscription);
          }
        }

        // 2. Clear old subscriptions
        for (const [key, subscription] of this.subscriptions) {
          if (!currentKeys.has(key)) {
            subscription.unsubscribe();
            this.subscriptions.delete(key);
          }
        }

        if (currentKeys.size > 0) {
          this.layer.batchDraw();
        }

        return dataRegion;
      }),
    );
  }

  private getRenderer(cellContent: unknown): IContentManager {
    if (typeof cellContent === 'string') {
      return this.renderers.get('')!;
    }

    return this.renderers.get('')!;
  }
}
