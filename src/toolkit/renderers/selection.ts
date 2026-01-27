import type { ISelectionRegion } from '../events';
import type { ISelectionStore } from '../events';
import type { IAccumulatedDimension, ICellDimension, ISheetConfig } from '../helpers';
import type { IShapePool } from '../pools';
import type { IExcelEntrance, ILocation, IPoint, IRegionInfo } from '../types';
import type Konva from 'konva';

import { Observable, of } from 'rxjs';
import { combineLatest, map, switchMap } from 'rxjs';

import { ServiceLocator } from '../../container';

import { RenderListener } from './renderer';
import { IRangeCollection } from './types';

interface IRectArea {
  top: number;
  left: number;
  right: number;
  bottom: number;
}

const ELineType = {
  EMPTY: 0,
  TOP: 1,
  LEFT: 2,
  RIGHT: 4,
  BOTTOM: 8,
} as const;
type ELineType = (typeof ELineType)[keyof typeof ELineType];
type ELineTypeMask = number;

interface ISelectionArea {
  selectionRegion: IRegionInfo;
  activeCellRegion?: IRegionInfo;
}

interface ISelectionAreaRect {
  corner?: ISelectionArea;
  top?: ISelectionArea;
  left?: ISelectionArea;
  main?: ISelectionArea;
}

function isSameRectArea(rectArea1: IRectArea, rectArea2: IRectArea) {
  return (
    rectArea1.top === rectArea2.top &&
    rectArea1.left === rectArea2.left &&
    rectArea1.bottom === rectArea2.bottom &&
    rectArea1.right === rectArea2.right
  );
}

/**
 * Selection renderer
 */
export class SelectionListener extends RenderListener<number> {
  private config: ISheetConfig;
  private rowAccumulatedDimension: IAccumulatedDimension;
  private columnAccumulatedDimension: IAccumulatedDimension;
  private cellDimension: ICellDimension;
  private selectionPool: IShapePool<Konva.RectConfig, Konva.Rect>;
  private selectionStore: ISelectionStore;
  private excelEntrance: IExcelEntrance;
  private selectionLinePool: IShapePool<Konva.LineConfig, Konva.Line>;
  private activeCellMarkerPool: IShapePool<Konva.RectConfig, Konva.Rect>;

  constructor(
    config: ISheetConfig,
    rowAccumulatedDimension: IAccumulatedDimension,
    columnAccumulatedDimension: IAccumulatedDimension,
    cellDimension: ICellDimension,
    selectionPool: IShapePool<Konva.RectConfig, Konva.Rect>,
    selectionStore: ISelectionStore,
    excelEntrance: IExcelEntrance,
    selectionLinePool: IShapePool<Konva.LineConfig, Konva.Line>,
    activeCellMarkerPool: IShapePool<Konva.RectConfig, Konva.Rect>,
  ) {
    super();

    this.config = config;
    this.rowAccumulatedDimension = rowAccumulatedDimension;
    this.columnAccumulatedDimension = columnAccumulatedDimension;
    this.cellDimension = cellDimension;
    this.selectionPool = selectionPool;
    this.selectionStore = selectionStore;
    this.excelEntrance = excelEntrance;
    this.selectionLinePool = selectionLinePool;
    this.activeCellMarkerPool = activeCellMarkerPool;
  }

  protected build(): Observable<number> {
    return this.selectionStore.list$.pipe(
      switchMap((list) => {
        const inputs: [region: IRegionInfo, activeCell?: ILocation][] = [];

        list.forEach((item) => {
          inputs.push([item.region, item.activeCell]);
        });

        this.getHighlightRegions(list).forEach((item) => {
          inputs.push([item, undefined]);
        });

        const normalSelection$ = combineLatest(
          inputs.map(([region, activeCell]) => this.renderSelection(region, activeCell)),
        ).pipe(
          map(() => {
            this.excelEntrance.selectionLayer.batchDraw();
            return list.length;
          }),
        );

        return normalSelection$;
      }),
      this.withPublish(),
    );
  }

  private getHighlightRegions(list: ISelectionRegion[]): IRegionInfo[] {
    const highlightedRows = ServiceLocator.current.get(IRangeCollection);
    const highlightedColumns = ServiceLocator.current.get(IRangeCollection);

    list.forEach(({ region }) => {
      highlightedRows.push([region.startRowIndex, region.endRowIndex]);
      highlightedColumns.push([region.startColumnIndex, region.endColumnIndex]);
    });

    highlightedRows.merge();
    highlightedColumns.merge();

    const items: IRegionInfo[] = [];

    highlightedColumns.values.forEach(([start, end]) => {
      items.push({ startColumnIndex: start, endColumnIndex: end, startRowIndex: 0, endRowIndex: 0 });
    });
    highlightedRows.values.forEach(([start, end]) => {
      items.push({ startRowIndex: start, endRowIndex: end, startColumnIndex: 0, endColumnIndex: 0 });
    });

    return items;
  }

  private renderSelection(region: IRegionInfo, activeCell?: ILocation): Observable<Konva.Shape[][]> {
    return combineLatest([this.splitAreaRect$(region, activeCell), this.getLimitArea()]).pipe(
      switchMap(([rectObj, limit]) => {
        const shapes$: Observable<Konva.Shape[]>[] = [];

        if (rectObj.corner) {
          let lineType: ELineTypeMask = ELineType.TOP | ELineType.LEFT;
          lineType |= rectObj.top ? ELineType.EMPTY : ELineType.RIGHT;
          lineType |= rectObj.left ? ELineType.EMPTY : ELineType.BOTTOM;

          shapes$.push(this.renderSelectionAreaRect(rectObj.corner, lineType, limit.corner, !activeCell));
        }
        if (rectObj.top) {
          let lineType: ELineTypeMask = ELineType.TOP | ELineType.RIGHT;
          lineType |= rectObj.corner ? ELineType.EMPTY : ELineType.LEFT;
          lineType |= rectObj.main ? ELineType.EMPTY : ELineType.BOTTOM;

          shapes$.push(this.renderSelectionAreaRect(rectObj.top, lineType, limit.top, !activeCell));
        }
        if (rectObj.left) {
          let lineType: ELineTypeMask = ELineType.LEFT | ELineType.BOTTOM;
          lineType |= rectObj.corner ? ELineType.EMPTY : ELineType.TOP;
          lineType |= rectObj.main ? ELineType.EMPTY : ELineType.RIGHT;

          shapes$.push(this.renderSelectionAreaRect(rectObj.left, lineType, limit.left, !activeCell));
        }
        if (rectObj.main) {
          let lineType: ELineTypeMask = ELineType.RIGHT | ELineType.BOTTOM;
          lineType |= rectObj.top ? ELineType.EMPTY : ELineType.TOP;
          lineType |= rectObj.left ? ELineType.EMPTY : ELineType.LEFT;

          shapes$.push(this.renderSelectionAreaRect(rectObj.main, lineType, limit.main, !activeCell));
        }

        return combineLatest(shapes$);
      }),
    );
  }

  private getLimitArea() {
    const fronzenLeftWidth$ = combineLatest([
      this.config.get$('frozenColumns'),
      this.columnAccumulatedDimension.get$,
    ]).pipe(map(([frozenColumns, getAccumulatedWidth]) => getAccumulatedWidth(frozenColumns)));

    const fronzenTopHeight$ = combineLatest([this.config.get$('frozenRows'), this.rowAccumulatedDimension.get$]).pipe(
      map(([frozenRows, getAccumulatedHeight]) => getAccumulatedHeight(frozenRows)),
    );

    return combineLatest([fronzenLeftWidth$, fronzenTopHeight$]).pipe(
      map(([width, height]) => {
        return {
          corner: { left: 0, top: 0, right: width, bottom: height },
          top: { left: width, top: 0, right: Infinity, bottom: height },
          left: { left: 0, top: height, right: width, bottom: Infinity },
          main: { left: width, top: height, right: Infinity, bottom: Infinity },
        };
      }),
    );
  }

  private renderSelectionAreaRect(
    selectionArea: ISelectionArea,
    lineType: ELineTypeMask,
    limit: IRectArea,
    isHighlight: boolean,
  ): Observable<Konva.Shape[]> {
    return combineLatest([
      this.getRectArea(selectionArea.selectionRegion, limit),
      selectionArea.activeCellRegion ? this.getRectArea(selectionArea.activeCellRegion, limit) : of(null),
    ]).pipe(
      switchMap(([selectionRegion, activeCellRegion]) => {
        const shapes: Observable<Konva.Shape>[] = [];
        if (selectionRegion && activeCellRegion && isSameRectArea(selectionRegion, activeCellRegion)) {
          shapes.push(this.renderActiveCell(activeCellRegion));
        } else if (selectionRegion) {
          if (!activeCellRegion) {
            shapes.push(this.renderRect(selectionRegion));

            if (!isHighlight) {
              /**
               * Draw lines in multiple directions.
               */
              if (lineType & ELineType.TOP) {
                shapes.push(
                  this.renderLine(
                    selectionRegion.top,
                    selectionRegion.left,
                    selectionRegion.top,
                    selectionRegion.right,
                  ),
                );
              }
              if (lineType & ELineType.LEFT) {
                shapes.push(
                  this.renderLine(
                    selectionRegion.top,
                    selectionRegion.left,
                    selectionRegion.bottom,
                    selectionRegion.left,
                  ),
                );
              }
              if (lineType & ELineType.RIGHT) {
                shapes.push(
                  this.renderLine(
                    selectionRegion.top,
                    selectionRegion.right,
                    selectionRegion.bottom,
                    selectionRegion.right,
                  ),
                );
              }
              if (lineType & ELineType.BOTTOM) {
                shapes.push(
                  this.renderLine(
                    selectionRegion.bottom,
                    selectionRegion.left,
                    selectionRegion.bottom,
                    selectionRegion.right,
                  ),
                );
              }
            }
          } else {
            const [rects, lines] = this.cave(selectionRegion, activeCellRegion, lineType, isHighlight);
            rects.forEach((rect) => shapes.push(this.renderRect(rect)));
            lines.forEach((line) => shapes.push(this.renderLine(line[0].y, line[0].x, line[1].y, line[1].x)));
          }
        }

        if (activeCellRegion) {
          shapes.push(this.renderActiveCell(activeCellRegion));
        }

        return combineLatest(shapes);
      }),
    );
  }

  private getRectArea(region: IRegionInfo, limit: IRectArea): Observable<IRectArea | null> {
    const { startColumnIndex, startRowIndex, endColumnIndex, endRowIndex } = region;

    const isSameCell = startColumnIndex === endColumnIndex && startRowIndex === endRowIndex;

    const endCellRectBox$ = this.cellDimension.getCellRectBox$.pipe(
      map((getCellRectBox) => getCellRectBox(endRowIndex, endColumnIndex)),
    );

    let rectArea$: Observable<IRectArea>;
    if (isSameCell) {
      rectArea$ = endCellRectBox$.pipe(
        map(({ x, y, width, height }) => ({ top: y, left: x, bottom: y + height, right: x + width }) as IRectArea),
      );
    } else {
      rectArea$ = combineLatest([
        this.cellDimension.getCellPoint$.pipe(map((getCellPoint) => getCellPoint(startRowIndex, startColumnIndex))),
        endCellRectBox$,
      ]).pipe(
        map(
          ([{ x, y }, { x: endX, y: endY, width, height }]) =>
            ({ top: y, left: x, bottom: endY + height, right: endX + width }) as IRectArea,
        ),
      );
    }

    return rectArea$.pipe(
      map((rectArea) => {
        const { top, left, bottom, right } = rectArea;
        const { top: limitTop, left: limitLeft, bottom: limitBottom, right: limitRight } = limit;

        const rect = {
          top: Math.max(top, limitTop),
          left: Math.max(left, limitLeft),
          bottom: Math.min(bottom, limitBottom),
          right: Math.min(right, limitRight),
        };
        return rect.top > rect.bottom || rect.left > rect.right ? null : rect;
      }),
    );
  }

  private renderRect({ top, left, bottom, right }: IRectArea, extraAttrs?: Partial<Konva.RectConfig>) {
    return this.selectionPool.get$.pipe(
      switchMap(
        (getRect) =>
          new Observable<Konva.Rect>((observer) => {
            const rect = getRect({
              x: left,
              y: top,
              width: right - left,
              height: bottom - top,
              ...extraAttrs,
            });

            observer.next(rect);
            return () => {
              this.selectionPool.reuse(rect);
            };
          }),
      ),
    );
  }

  private renderActiveCell({ top, left, bottom, right }: IRectArea, extraAttrs?: Partial<Konva.RectConfig>) {
    return this.activeCellMarkerPool.get$.pipe(
      switchMap(
        (getRect) =>
          new Observable<Konva.Rect>((observer) => {
            const rect = getRect({
              x: left,
              y: top,
              width: right - left,
              height: bottom - top,
              ...extraAttrs,
            });

            observer.next(rect);
            return () => {
              this.activeCellMarkerPool.reuse(rect);
            };
          }),
      ),
    );
  }

  private renderLine(top: number, left: number, bottom: number, right: number) {
    return this.selectionLinePool.get$.pipe(
      switchMap(
        (getLine) =>
          new Observable<Konva.Line>((observer) => {
            const selectionLine = getLine({
              points: [left, top, right, bottom],
            });

            observer.next(selectionLine);
            return () => {
              this.selectionLinePool.reuse(selectionLine);
            };
          }),
      ),
    );
  }

  /**
   * Split the selection area into multiple sub-areas, excluding the active cell area.
   * Returns a list of IRectArea that cover the selection area except the active cell.
   *
   * The algorithm divides the selection into up to 4 regions:
   * - Top: above the active cell (full width of selection)
   * - Bottom: below the active cell (full width of selection)
   * - Left: left of active cell (between top and bottom regions)
   * - Right: right of active cell (between top and bottom regions)
   */
  private cave(
    selectionRegion: IRectArea,
    activeCellRegion: IRectArea | null,
    lineType: ELineTypeMask,
    isHighlight: boolean,
  ): [IRectArea[], [begin: IPoint, end: IPoint][]] {
    // If no active cell area, return the entire selection as a single area
    if (!activeCellRegion) {
      return [[selectionRegion], []];
    }

    // Calculate the intersection of active cell area with selection area
    const activeTop = Math.max(activeCellRegion.top, selectionRegion.top);
    const activeBottom = Math.min(activeCellRegion.bottom, selectionRegion.bottom);
    const activeLeft = Math.max(activeCellRegion.left, selectionRegion.left);
    const activeRight = Math.min(activeCellRegion.right, selectionRegion.right);

    // If active cell doesn't intersect with selection, return entire selection
    if (activeTop >= activeBottom || activeLeft >= activeRight) {
      return [[selectionRegion], []];
    }

    const list: IRectArea[] = [];
    const lines: [begin: IPoint, end: IPoint][] = [];

    // Top region: above the active cell (full width)
    if (selectionRegion.top < activeTop) {
      const rect: IRectArea = {
        top: selectionRegion.top,
        left: selectionRegion.left,
        right: selectionRegion.right,
        bottom: activeTop,
      };
      list.push(rect);

      if (!isHighlight) {
        if (lineType & ELineType.TOP) {
          lines.push([
            { x: rect.left, y: rect.top },
            { x: rect.right, y: rect.top },
          ]);
        }
        if (lineType & ELineType.LEFT) {
          lines.push([
            { x: rect.left, y: rect.top },
            { x: rect.left, y: rect.bottom },
          ]);
        }
        if (lineType & ELineType.RIGHT) {
          lines.push([
            { x: rect.right, y: rect.top },
            { x: rect.right, y: rect.bottom },
          ]);
        }
      }
    }

    // Bottom region: below the active cell (full width)
    if (activeBottom < selectionRegion.bottom) {
      const rect: IRectArea = {
        top: activeBottom,
        left: selectionRegion.left,
        right: selectionRegion.right,
        bottom: selectionRegion.bottom,
      };
      list.push(rect);

      if (!isHighlight) {
        if (lineType & ELineType.BOTTOM) {
          lines.push([
            { x: rect.left, y: rect.bottom },
            { x: rect.right, y: rect.bottom },
          ]);
        }
        if (lineType & ELineType.LEFT) {
          lines.push([
            { x: rect.left, y: rect.top },
            { x: rect.left, y: rect.bottom },
          ]);
        }
        if (lineType & ELineType.RIGHT) {
          lines.push([
            { x: rect.right, y: rect.top },
            { x: rect.right, y: rect.bottom },
          ]);
        }
      }
    }

    // Left region: left of active cell (between top and bottom of active cell)
    if (selectionRegion.left < activeLeft) {
      const rect: IRectArea = {
        top: activeTop,
        left: selectionRegion.left,
        right: activeLeft,
        bottom: activeBottom,
      };
      list.push(rect);

      if (!isHighlight) {
        if (lineType & ELineType.LEFT) {
          lines.push([
            { x: rect.left, y: rect.top },
            { x: rect.left, y: rect.bottom },
          ]);
        }

        if (selectionRegion.top >= activeTop && lineType & ELineType.TOP) {
          lines.push([
            { x: rect.left, y: rect.top },
            { x: rect.right, y: rect.top },
          ]);
        }

        if (activeBottom >= selectionRegion.bottom && lineType & ELineType.BOTTOM) {
          lines.push([
            { x: rect.left, y: rect.bottom },
            { x: rect.right, y: rect.bottom },
          ]);
        }
      }
    }

    // Right region: right of active cell (between top and bottom of active cell)
    if (activeRight < selectionRegion.right) {
      const rect: IRectArea = {
        top: activeTop,
        left: activeRight,
        right: selectionRegion.right,
        bottom: activeBottom,
      };
      list.push(rect);

      if (!isHighlight) {
        if (lineType & ELineType.RIGHT) {
          lines.push([
            { x: rect.right, y: rect.top },
            { x: rect.right, y: rect.bottom },
          ]);
        }

        if (selectionRegion.top >= activeTop && lineType & ELineType.TOP) {
          lines.push([
            { x: rect.left, y: rect.top },
            { x: rect.right, y: rect.top },
          ]);
        }

        if (activeBottom >= selectionRegion.bottom && lineType & ELineType.BOTTOM) {
          lines.push([
            { x: rect.left, y: rect.bottom },
            { x: rect.right, y: rect.bottom },
          ]);
        }
      }
    }

    return [list, lines];
  }

  private splitAreaRect$(region: IRegionInfo, activeCell?: ILocation): Observable<ISelectionAreaRect> {
    const originalActiveCellRegion: IRegionInfo | undefined = !activeCell
      ? undefined
      : {
          startRowIndex: activeCell.rowIndex,
          startColumnIndex: activeCell.columnIndex,
          endRowIndex: activeCell.rowIndex,
          endColumnIndex: activeCell.columnIndex,
        };

    return combineLatest([this.config.get$('frozenColumns'), this.config.get$('frozenRows')]).pipe(
      map(([frozenColumns, frozenRows]) => {
        const selectionRegion: ISelectionAreaRect = {};

        const maxFrozenRowIndex = frozenRows - 1;
        const maxFrozenColumnIndex = frozenColumns - 1;

        const cornerRect = [0, 0, maxFrozenColumnIndex, maxFrozenRowIndex] as const;
        const cornerRegion = this.getSubRegion(region, ...cornerRect);
        if (cornerRegion) {
          const activeCellRegion = originalActiveCellRegion
            ? this.getSubRegion(originalActiveCellRegion, ...cornerRect)
            : undefined;
          selectionRegion.corner = { selectionRegion: cornerRegion, activeCellRegion };
        }

        const topRect = [0, frozenColumns, Infinity, maxFrozenRowIndex] as const;
        const topRegion = this.getSubRegion(region, ...topRect);
        if (topRegion) {
          const activeCellRegion = originalActiveCellRegion
            ? this.getSubRegion(originalActiveCellRegion, ...topRect)
            : undefined;
          selectionRegion.top = { selectionRegion: topRegion, activeCellRegion };
        }

        const leftRect = [frozenRows, 0, maxFrozenColumnIndex] as const;
        const leftRegion = this.getSubRegion(region, ...leftRect);
        if (leftRegion) {
          const activeCellRegion = originalActiveCellRegion
            ? this.getSubRegion(originalActiveCellRegion, ...leftRect)
            : undefined;
          selectionRegion.left = { selectionRegion: leftRegion, activeCellRegion };
        }

        const mainRect = [frozenRows, frozenColumns] as const;
        const mainRegion = this.getSubRegion(region, ...mainRect);
        if (mainRegion) {
          const activeCellRegion = originalActiveCellRegion
            ? this.getSubRegion(originalActiveCellRegion, ...mainRect)
            : undefined;
          selectionRegion.main = { selectionRegion: mainRegion, activeCellRegion };
        }

        return selectionRegion;
      }),
    );
  }

  private getSubRegion(
    region: IRegionInfo,
    top: number,
    left: number,
    right = Infinity,
    bottom = Infinity,
  ): IRegionInfo | undefined {
    const { startRowIndex, startColumnIndex, endRowIndex, endColumnIndex } = region;

    const maxTop = Math.max(startRowIndex, top);
    const minBottom = Math.min(endRowIndex, bottom);
    const maxLeft = Math.max(startColumnIndex, left);
    const minRight = Math.min(endColumnIndex, right);

    if (maxTop <= minBottom && maxLeft <= minRight) {
      return {
        startRowIndex: maxTop,
        startColumnIndex: maxLeft,
        endRowIndex: minBottom,
        endColumnIndex: minRight,
      };
    }
  }
}
