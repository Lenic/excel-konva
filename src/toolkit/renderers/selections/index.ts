import type { ISelectionRegion, ISelectionStore } from '../../events';
import type { IAccumulatedDimension, ICellDimension, ISheetConfig } from '../../helpers';
import type { IShapePool } from '../../pools';
import type { IExcelEntrance, IRectBox, IRegionInfo } from '../../types';
import type { IRectArea, IRectLimitInfo, TLineTypeMask, TRectRenderInfo, TSelectionInfo } from './types';
import type Konva from 'konva';

import { combineLatest, distinctUntilChanged, map, Observable, of, switchMap } from 'rxjs';

import { EFreezeMode } from '../../types';
import { RangeCollection } from '../range';
import { RenderListener } from '../renderer';
import { CollectionSubscription } from '../subscription';

import { ELineType, ERenderType } from './types';
import {
  addLines,
  correctRenderInfo,
  findLineType,
  generateSubregionRenderInfo,
  intersectionArea,
  isSameRectBox,
  splitByFreezeMode,
} from './utils';

/**
 * Selection renderer
 */
export class SelectionListener extends RenderListener<number> {
  private config: ISheetConfig;
  private rowAccumulatedDimension: IAccumulatedDimension;
  private columnAccumulatedDimension: IAccumulatedDimension;
  private cellDimension: ICellDimension;
  private rectPool: IShapePool<Konva.RectConfig, Konva.Rect>;
  private selectionStore: ISelectionStore;
  private excelEntrance: IExcelEntrance;
  private linePool: IShapePool<Konva.LineConfig, Konva.Line>;
  private activeCellPool: IShapePool<Konva.RectConfig, Konva.Rect>;
  private activeCellLinePool: IShapePool<Konva.LineConfig, Konva.Line>;

  private limit$: Observable<IRectLimitInfo>;
  private subscriptions: CollectionSubscription;

  constructor(
    config: ISheetConfig,
    rowAccumulatedDimension: IAccumulatedDimension,
    columnAccumulatedDimension: IAccumulatedDimension,
    cellDimension: ICellDimension,
    rectPool: IShapePool<Konva.RectConfig, Konva.Rect>,
    selectionStore: ISelectionStore,
    excelEntrance: IExcelEntrance,
    linePool: IShapePool<Konva.LineConfig, Konva.Line>,
    activeCellPool: IShapePool<Konva.RectConfig, Konva.Rect>,
    activeCellLinePool: IShapePool<Konva.LineConfig, Konva.Line>,
  ) {
    super();

    this.config = config;
    this.rowAccumulatedDimension = rowAccumulatedDimension;
    this.columnAccumulatedDimension = columnAccumulatedDimension;
    this.cellDimension = cellDimension;
    this.rectPool = rectPool;
    this.selectionStore = selectionStore;
    this.excelEntrance = excelEntrance;
    this.linePool = linePool;
    this.activeCellPool = activeCellPool;
    this.activeCellLinePool = activeCellLinePool;

    this.limit$ = this.buildLimit$();
    this.disposeWithMe(this.limit$.subscribe());

    this.subscriptions = new CollectionSubscription();
    this.disposeWithMe(this.subscriptions);
  }

  protected build(): Observable<number> {
    return this.selectionStore.list$.pipe(
      map((list) => {
        const items: [key: string, getter: () => Observable<any>][] = [];

        list.forEach((region) => {
          const key = `SelectionRegion:${region.region.startRowIndex}-${region.region.startColumnIndex}-${region.region.endRowIndex}-${region.region.endColumnIndex}-${region.activeCell.rowIndex}-${region.activeCell.columnIndex}`;
          items.push([key, () => this.buildSelectionRegion$(region)] as const);
        });

        this.buildHighlightRegions(list, (key, getter) => {
          items.push([key, getter] as const);
        });

        this.subscriptions.update(items);

        return list.length;
      }),
    );
  }

  private buildHighlightRegions(
    list: ISelectionRegion[],
    addCallback: (key: string, getter: () => Observable<any>) => void,
  ) {
    const highlightedRows = new RangeCollection();
    const highlightedColumns = new RangeCollection();

    list.forEach(({ region }) => {
      highlightedRows.push([region.startRowIndex, region.endRowIndex]);
      highlightedColumns.push([region.startColumnIndex, region.endColumnIndex]);
    });

    highlightedRows.merge();
    highlightedColumns.merge();

    highlightedColumns.values.forEach(([start, end]) => {
      const key = `highlight-column-${start}-${end}`;
      const region: IRegionInfo = {
        startColumnIndex: start,
        endColumnIndex: end,
        startRowIndex: 0,
        endRowIndex: 0,
      };
      addCallback(key, () => this.buildHighlightRegion$(region));
    });
    highlightedRows.values.forEach(([start, end]) => {
      const key = `highlight-row-${start}-${end}`;
      const region: IRegionInfo = {
        startRowIndex: start,
        endRowIndex: end,
        startColumnIndex: 0,
        endColumnIndex: 0,
      };
      addCallback(key, () => this.buildHighlightRegion$(region));
    });

    highlightedRows.clear();
    highlightedColumns.clear();
  }

  private buildHighlightRegion$(region: IRegionInfo) {
    return this.limit$.pipe(
      switchMap((limitInfo) => {
        const quadrants = splitByFreezeMode(limitInfo.limitRegion, region);

        const highlight$List: Observable<Konva.Shape[]>[] = [];
        for (const [key, selectionInfo] of quadrants) {
          highlight$List.push(this.renderHighlight$(selectionInfo[0], limitInfo.limitArea[key]));
        }
        return combineLatest(highlight$List);
      }),
    );
  }

  private renderHighlight$(region: IRegionInfo, limit: IRectArea) {
    const { startColumnIndex, startRowIndex, endColumnIndex, endRowIndex } = region;
    return this.cellDimension.getCellRectBox$.pipe(
      map((getBox) => [getBox(startRowIndex, startColumnIndex), getBox(endRowIndex, endColumnIndex)]),
      distinctUntilChanged(([x, a], [y, b]) => isSameRectBox(x, y) && isSameRectBox(a, b)),
      switchMap(([startCell, endCell]) => {
        const rectArea: IRectArea = {
          top: startCell.y,
          left: startCell.x,
          right: endCell.x + endCell.width,
          bottom: endCell.y + endCell.height,
        };
        const selection = intersectionArea(rectArea, limit);
        if (!selection) return of([]);

        const shapes: TRectRenderInfo[] = [];
        generateSubregionRenderInfo([selection, ELineType.EMPTY, ERenderType.RECT], undefined, limit, (shape) =>
          shapes.push(shape),
        );

        const rect$List: Observable<Konva.Shape>[] = [];
        shapes.forEach((shape) => {
          if (shape[2] === ERenderType.RECT) {
            this.renderRect(shape[0], shape[1], (rect$) => rect$List.push(rect$));
          }
        });

        return combineLatest(rect$List);
      }),
    );
  }

  private buildSelectionRegion$(selectionRegion: ISelectionRegion) {
    return this.limit$.pipe(
      switchMap((limitInfo) => {
        const quadrants = splitByFreezeMode(limitInfo.limitRegion, selectionRegion.region, selectionRegion.activeCell);

        const selection$List: Observable<Konva.Shape[]>[] = [];
        for (const [key, selectionInfo] of quadrants) {
          const lineType = findLineType(key, (current) => quadrants.has(current));
          const selection$ = this.renderSelection$(selectionInfo, limitInfo.limitArea[key], lineType);
          selection$List.push(selection$);
        }
        return combineLatest(selection$List);
      }),
    );
  }

  private renderSelection$(renderInfo: TSelectionInfo<IRegionInfo>, limit: IRectArea, lineType: TLineTypeMask) {
    const [selection, activeCell] = renderInfo;
    const { startColumnIndex, startRowIndex, endColumnIndex, endRowIndex } = selection;
    return this.cellDimension.getCellRectBox$.pipe(
      map((getBox): [startCell: IRectBox, endCell: IRectBox, activeCell: IRectBox | undefined] => {
        const startCell = getBox(startRowIndex, startColumnIndex);
        const endCell = getBox(endRowIndex, endColumnIndex);

        if (!activeCell) return [startCell, endCell, undefined];

        const { startColumnIndex: columnIndex, startRowIndex: rowIndex } = activeCell;

        if (startColumnIndex === columnIndex && startRowIndex === rowIndex) {
          return [startCell, endCell, startCell];
        }

        if (endColumnIndex === columnIndex && endRowIndex === rowIndex) {
          return [startCell, endCell, endCell];
        }

        return [startCell, endCell, getBox(rowIndex, columnIndex)];
      }),
      distinctUntilChanged(([x, a], [y, b]) => isSameRectBox(x, y) && isSameRectBox(a, b)),
      switchMap(([startCell, endCell, cell]) => {
        const rectArea: IRectArea = {
          top: startCell.y,
          left: startCell.x,
          right: endCell.x + endCell.width,
          bottom: endCell.y + endCell.height,
        };

        const cellArea: IRectArea | undefined = !cell
          ? undefined
          : {
              top: cell.y,
              left: cell.x,
              right: cell.x + cell.width,
              bottom: cell.y + cell.height,
            };

        const selection = correctRenderInfo([rectArea, lineType, ERenderType.RECT], limit);
        if (!selection) return of([]);

        const activeCell = cellArea ? correctRenderInfo([cellArea, ELineType.ALL, ERenderType.CELL], limit) : undefined;

        const shapes: TRectRenderInfo[] = [];
        generateSubregionRenderInfo(selection, activeCell, limit, (shape) => shapes.push(shape));

        const line$List: Observable<Konva.Shape>[] = [];
        const rect$List: Observable<Konva.Shape>[] = [];
        shapes.forEach((shape) => {
          if (shape[2] === ERenderType.RECT) {
            this.renderRect(
              shape[0],
              shape[1],
              (rect$) => rect$List.push(rect$),
              (line$) => line$List.push(line$),
            );
          } else {
            this.renderActiveCell(
              shape[0],
              shape[1],
              (rect$) => rect$List.push(rect$),
              (line$) => line$List.push(line$),
            );
          }
        });

        return combineLatest([...rect$List, ...line$List]);
      }),
    );
  }

  private renderRect(
    rect: IRectArea,
    lineType: TLineTypeMask,
    addRect: (rect$: Observable<Konva.Rect>) => void,
    addLine?: (line$: Observable<Konva.Line>) => void,
  ) {
    const { top, left, right, bottom } = rect;
    const width = right - left;
    const height = bottom - top;

    const rect$ = this.rectPool.get$.pipe(
      switchMap(
        (getRect) =>
          new Observable<Konva.Rect>((observer) => {
            const rect = getRect({ x: left, y: top, width, height });

            observer.next(rect);
            this.excelEntrance.selectionLayer.batchDraw();
            return () => {
              this.rectPool.reuse(rect);
            };
          }),
      ),
    );
    addRect(rect$);
    if (addLine) {
      addLines(rect, lineType, this.linePool, addLine);
    }
  }

  private renderActiveCell(
    rect: IRectArea,
    lineType: TLineTypeMask,
    addRect: (rect$: Observable<Konva.Rect>) => void,
    addLine: (line$: Observable<Konva.Line>) => void,
  ) {
    const { top, left, right, bottom } = rect;
    const width = right - left;
    const height = bottom - top;

    const rect$ = this.activeCellPool.get$.pipe(
      switchMap(
        (getRect) =>
          new Observable<Konva.Rect>((observer) => {
            const rect = getRect({ x: left, y: top, width, height });

            observer.next(rect);
            this.excelEntrance.selectionLayer.batchDraw();
            return () => {
              this.activeCellPool.reuse(rect);
            };
          }),
      ),
    );
    addRect(rect$);
    addLines(rect, lineType, this.activeCellLinePool, addLine);
  }

  private buildLimit$(): Observable<IRectLimitInfo> {
    const width$ = combineLatest([
      this.config.get$('frozenColumns'),
      this.config.get$('columnCount'),
      this.columnAccumulatedDimension.get$,
    ]).pipe(
      map(
        ([frozenColumns, columnCount, getWidth]) =>
          [
            getWidth(frozenColumns),
            getWidth(columnCount) - getWidth(frozenColumns),
            frozenColumns,
            columnCount,
          ] as const,
      ),
    );

    const height$ = combineLatest([
      this.config.get$('frozenRows'),
      this.config.get$('rowCount'),
      this.rowAccumulatedDimension.get$,
    ]).pipe(
      map(
        ([frozenRows, rowCount, getHeight]) =>
          [getHeight(frozenRows), getHeight(rowCount) - getHeight(frozenRows), frozenRows, rowCount] as const,
      ),
    );

    return combineLatest([width$, height$]).pipe(
      map(
        ([
          [frozenWidth, totalWidth, frozenColumns, columnCount],
          [frozenHeight, totalHeight, frozenRows, rowCount],
        ]) => {
          const limitArea: Record<EFreezeMode, IRectArea> = {
            [EFreezeMode.BOTH]: { top: 0, left: 0, right: frozenWidth, bottom: frozenHeight },
            [EFreezeMode.ROW]: { top: 0, left: frozenWidth, right: totalWidth, bottom: frozenHeight },
            [EFreezeMode.COLUMN]: { top: frozenHeight, left: 0, right: frozenWidth, bottom: totalHeight },
            [EFreezeMode.NONE]: { top: frozenHeight, left: frozenWidth, right: totalWidth, bottom: totalHeight },
          };

          const frozenRowIndex = frozenRows - 1;
          const frozenColumnIndex = frozenColumns - 1;
          const maxRowIndex = rowCount - 1;
          const maxColumnIndex = columnCount - 1;
          const limitRegion: Record<EFreezeMode, IRegionInfo> = {
            [EFreezeMode.BOTH]: {
              startRowIndex: 0,
              startColumnIndex: 0,
              endRowIndex: frozenRowIndex,
              endColumnIndex: frozenColumnIndex,
            },
            [EFreezeMode.ROW]: {
              startRowIndex: 0,
              startColumnIndex: frozenColumns,
              endRowIndex: frozenRowIndex,
              endColumnIndex: maxColumnIndex,
            },
            [EFreezeMode.COLUMN]: {
              startRowIndex: frozenRows,
              startColumnIndex: 0,
              endRowIndex: maxRowIndex,
              endColumnIndex: frozenColumnIndex,
            },
            [EFreezeMode.NONE]: {
              startRowIndex: frozenRows,
              startColumnIndex: frozenColumns,
              endRowIndex: maxRowIndex,
              endColumnIndex: maxColumnIndex,
            },
          };

          return { limitArea, limitRegion, frozenColumns, frozenRows };
        },
      ),
      this.withPublish(),
    );
  }
}
