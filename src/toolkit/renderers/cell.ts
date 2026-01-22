import type { IContentManager, IContentRendererContext } from '../contents';
import type { ICellDimension, IDataRegion, ISheetConfig } from '../helpers';
import type { IRegionInfo } from '../types';
import type { Observable } from 'rxjs';

import { combineLatest, distinctUntilChanged, map, switchMap } from 'rxjs';

import { ECellFrozenType } from '../contents';

import { RenderListener } from './renderer';
import { CollectionSubscription } from './subscription';

/**
 * Cell listener
 */
export class CellListener extends RenderListener<IRegionInfo> {
  private config: ISheetConfig;
  private dataRegion: IDataRegion;
  private cellDimension: ICellDimension;
  private renderers: Map<string | symbol, IContentManager>;

  private subscriptions: CollectionSubscription;

  /**
   * Cell listener
   *
   * @param config - sheet config
   * @param dataRegion - data region
   * @param cellDimension - cell dimension
   * @param renderers - content renderers
   */
  constructor(
    config: ISheetConfig,
    dataRegion: IDataRegion,
    cellDimension: ICellDimension,
    renderers: Map<string | symbol, IContentManager>,
  ) {
    super();

    this.config = config;
    this.dataRegion = dataRegion;
    this.cellDimension = cellDimension;
    this.renderers = renderers;

    this.subscriptions = new CollectionSubscription();
    this.disposeWithMe(this.subscriptions);
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

        this.subscriptions.update(
          items.map((item) => [
            `${item.rowIndex}:${item.columnIndex}:${item.frozenType}`,
            this.cellDimension.getCellData$.pipe(
              map((getData) => getData(item.rowIndex, item.columnIndex)),
              distinctUntilChanged(),
              switchMap((cellContent) => this.getRenderer(cellContent).render(cellContent, item)),
            ),
          ]),
        );
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
