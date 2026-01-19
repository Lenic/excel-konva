import type { ICellDimension, IDataRegion, ISheetConfig } from '../helpers';
import type { ICellPool } from '../pools';
import type { ICellRegionOptions, IExcelEntrance, IRegionInfo } from '../types';
import type { Observable } from 'rxjs';

import { combineLatest, map, switchMap, take } from 'rxjs';

import { RenderListener } from './renderer';

export class CellListener extends RenderListener<IRegionInfo> {
  private config: ISheetConfig;
  private cellDimension: ICellDimension;
  private dataRegion: IDataRegion;
  private excelEntrance: IExcelEntrance;
  private cellPool: ICellPool;

  constructor(
    config: ISheetConfig,
    cellDimension: ICellDimension,
    dataRegion: IDataRegion,
    excelEntrance: IExcelEntrance,
    cellPool: ICellPool,
  ) {
    super();

    this.config = config;
    this.cellDimension = cellDimension;
    this.dataRegion = dataRegion;
    this.excelEntrance = excelEntrance;
    this.cellPool = cellPool;
  }

  protected build(): Observable<IRegionInfo> {
    return combineLatest([
      this.excelEntrance.getCellGroup$,
      this.cellDimension.getCellRectBox$,
      this.cellDimension.getCellData$,
      this.cellPool.getRect$,
      this.cellPool.getText$,
    ]).pipe(
      switchMap(([getCellGroup, getCellRectBox, getCellData, getRect, getText]) => {
        /**
         * Draw target cell
         *
         * @param rowIndex - The row index of the cell
         * @param columnIndex - The column index of the cell
         * @param options - Configuration options for the cell
         */
        const renderCellRegion = (rowIndex: number, columnIndex: number, options: ICellRegionOptions) => {
          const group = getCellGroup(rowIndex, columnIndex);
          const { x, y, width, height } = getCellRectBox(rowIndex, columnIndex);

          const rect = getRect();
          rect.setAttrs({
            ...options.rectAttrs,
            x,
            y,
            width,
            height,
          });
          if (rect.parent !== group) rect.moveTo(group);

          const text = getText();
          text.setAttrs({
            ...options.textAttrs,
            x,
            y,
            width,
            height,
            text: getCellData(rowIndex, columnIndex),
          });
          if (text.parent !== group) text.moveTo(group);
        };

        return combineLatest([
          this.dataRegion.region$,
          this.config.get$('frozenColumns').pipe(take(1)),
          this.config.get$('frozenRows').pipe(take(1)),
        ]).pipe(map((items) => [renderCellRegion, ...items] as const));
      }),
      map(([renderCellRegion, dataRegion, frozenColumns, frozenRows]) => {
        const { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } = dataRegion;

        this.cellPool.reset();

        // Render Scrollable Data
        for (let r = startRowIndex; r < endRowIndex; r++) {
          for (let c = startColumnIndex; c < endColumnIndex; c++) {
            renderCellRegion(r, c, {
              rectAttrs: {
                fill: r % 2 === 0 ? '#ffffff' : '#f9f9f9',
                stroke: '#e8e8e8',
                strokeWidth: 0.5,
              },
              textAttrs: {
                fill: '#333333',
                fontSize: 12,
                align: 'left',
                padding: 8,
                ellipsis: true,
                wrap: 'none',
              },
            });
          }
        }

        // Render Frozen Header
        for (let r = 0; r < frozenRows; r++) {
          for (let c = startColumnIndex; c < endColumnIndex; c++) {
            renderCellRegion(r, c, {
              rectAttrs: {
                fill: r === 0 ? '#f0f0f0' : r % 2 === 0 ? '#ffffff' : '#f9f9f9',
                stroke: '#cccccc',
                strokeWidth: 1,
              },
              textAttrs: {
                fill: '#000000',
                fontSize: r === 0 ? 14 : 12,
                align: r === 0 ? 'center' : 'left',
                padding: 8,
                ellipsis: true,
                wrap: 'none',
              },
            });
          }
        }

        // Render Frozen Side
        for (let c = 0; c < frozenColumns; c++) {
          for (let r = startRowIndex; r < endRowIndex; r++) {
            renderCellRegion(r, c, {
              rectAttrs: {
                fill: c === 0 ? '#f0f0f0' : r % 2 === 0 ? '#ffffff' : '#f9f9f9',
                stroke: '#cccccc',
                strokeWidth: 1,
              },
              textAttrs: {
                fill: '#333333',
                fontSize: 12,
                align: c === 0 ? 'center' : 'left',
                padding: c === 0 ? 0 : 8,
                ellipsis: true,
                wrap: 'none',
              },
            });
          }
        }

        // Render Corner
        for (let r = 0; r < frozenRows; r++) {
          for (let c = 0; c < frozenColumns; c++) {
            renderCellRegion(r, c, {
              rectAttrs: {
                fill: r === 0 && c === 0 ? '#e0e0e0' : '#f0f0f0',
                stroke: '#cccccc',
                strokeWidth: 1,
              },
              textAttrs: {
                fill: '#000000',
                fontSize: r === 0 ? 14 : 12,
                align: c === 0 ? 'center' : r === 0 ? 'center' : 'left',
                padding: c === 0 ? 0 : 8,
                ellipsis: true,
                wrap: 'none',
              },
            });
          }
        }

        this.excelEntrance.backgroundLayer.batchDraw();

        return dataRegion;
      }),
    );
  }
}
