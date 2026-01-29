import type { ISelectionRegion, ISelectionStore } from '../../events';
import type { IAccumulatedDimension, ICellDimension, ISheetConfig } from '../../helpers';
import type { IShapePool } from '../../pools';
import type { IExcelEntrance, IRectBox, IRegionInfo } from '../../types';
import type { IRectArea, IRectLimitInfo, TLineTypeMask, TRectRenderInfo, TSelectionInfo } from './types';
import type Konva from 'konva';

import { combineLatest, distinctUntilChanged, map, merge, mergeAll, Observable, of, switchMap } from 'rxjs';

import { RenderListener } from '../renderer';

import { ELineType, EQuadrantType, ERenderType } from './types';
import {
  addLines,
  buildDeltaSelectionRegions,
  buildHighlightRegions,
  buildSelectionRegions,
  correctRenderInfo,
  findLineType,
  generateSubregionRenderInfo,
  intersectionArea,
  isSameRectBox,
  splitIntoQuadrants,
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
  }

  protected build(): Observable<number> {
    const delta$ = buildDeltaSelectionRegions(this.selectionStore.list$).pipe(this.withPublish());
    const highlightRegions$ = buildHighlightRegions(delta$, (item) => this.buildHighlightRegion$(item));
    const selectionRegions$ = buildSelectionRegions(delta$, (item) => this.buildSelectionRegion$(item));

    return merge(highlightRegions$, selectionRegions$).pipe(
      mergeAll(),
      distinctUntilChanged(),
      switchMap(() => this.selectionStore.list$),
      map((list) => list.length),
      distinctUntilChanged(),
    );
  }

  private buildHighlightRegion$(region: IRegionInfo) {
    return this.buildLimit$().pipe(
      switchMap((limitInfo) => {
        const quadrants = splitIntoQuadrants(limitInfo.limitRegion, region);

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
    return this.buildLimit$().pipe(
      switchMap((limitInfo) => {
        const quadrants = splitIntoQuadrants(limitInfo.limitRegion, selectionRegion.region, selectionRegion.activeCell);

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
    const frozenWidth$ = combineLatest([this.config.get$('frozenColumns'), this.columnAccumulatedDimension.get$]).pipe(
      map(([frozenColumns, getWidth]) => [getWidth(frozenColumns), frozenColumns] as const),
    );

    const frozenHeight$ = combineLatest([this.config.get$('frozenRows'), this.rowAccumulatedDimension.get$]).pipe(
      map(([frozenRows, getHeight]) => [getHeight(frozenRows), frozenRows] as const),
    );

    const max = 999999999999999;

    return combineLatest([frozenWidth$, frozenHeight$]).pipe(
      map(([[frozenWidth, frozenColumns], [frozenHeight, frozenRows]]) => {
        const limitArea: Record<EQuadrantType, IRectArea> = {
          [EQuadrantType.CORNER]: { top: 0, left: 0, right: frozenWidth, bottom: frozenHeight },
          [EQuadrantType.TOP]: { top: 0, left: frozenWidth, right: max, bottom: frozenHeight },
          [EQuadrantType.LEFT]: { top: frozenHeight, left: 0, right: frozenWidth, bottom: max },
          [EQuadrantType.MAIN]: { top: frozenHeight, left: frozenWidth, right: max, bottom: max },
        };

        const frozenRowIndex = frozenRows - 1;
        const frozenColumnIndex = frozenColumns - 1;
        const limitRegion: Record<EQuadrantType, IRegionInfo> = {
          [EQuadrantType.CORNER]: {
            startRowIndex: 0,
            startColumnIndex: 0,
            endRowIndex: frozenRowIndex,
            endColumnIndex: frozenColumnIndex,
          },
          [EQuadrantType.TOP]: {
            startRowIndex: 0,
            startColumnIndex: frozenColumns,
            endRowIndex: frozenRowIndex,
            endColumnIndex: max,
          },
          [EQuadrantType.LEFT]: {
            startRowIndex: frozenRows,
            startColumnIndex: 0,
            endRowIndex: max,
            endColumnIndex: frozenColumnIndex,
          },
          [EQuadrantType.MAIN]: {
            startRowIndex: frozenRows,
            startColumnIndex: frozenColumns,
            endRowIndex: max,
            endColumnIndex: max,
          },
        };

        return { limitArea, limitRegion, frozenColumns, frozenRows };
      }),
    );
  }
}
