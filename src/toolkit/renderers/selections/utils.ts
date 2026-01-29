import type { ISelectionRegion } from '../../events';
import type { IShapePool } from '../../pools';
import type { ILocation, IRegionInfo } from '../../types';
import type { IRectArea, TLineTypeMask, TRectRenderInfo, TSelectionInfo } from './types';
import type Konva from 'konva';

import { Observable, switchMap } from 'rxjs';

import { EQuadrantType, ERenderType } from './types';
import { ELineType } from './types';

export function isSameArea(x?: IRectArea, y?: IRectArea): boolean {
  if (!x && !y) return true;
  if (!x || !y) return false;
  return x.top === y.top && x.left === y.left && x.bottom === y.bottom && x.right === y.right;
}

export function getSelectionRegionKey(region: ISelectionRegion): string {
  return `SelectionRegion:${region.region.startRowIndex}-${region.region.startColumnIndex}-${region.region.endRowIndex}-${region.region.endColumnIndex}-${region.activeCell.rowIndex}-${region.activeCell.columnIndex}`;
}

export function different<T>(original: Set<T>, updated: Set<T>): [added: Set<T>, removed: Set<T>] {
  const added = new Set<T>();
  const removed = new Set<T>();

  updated.forEach((item) => {
    if (!original.has(item)) {
      added.add(item);
    }
  });

  original.forEach((item) => {
    if (!updated.has(item)) {
      removed.add(item);
    }
  });

  return [added, removed];
}

export function intersectionArea(x: IRectArea, y: IRectArea): IRectArea | undefined {
  const maxLeft = Math.max(x.left, y.left);
  const minRight = Math.min(x.right, y.right);
  const maxTop = Math.max(x.top, y.top);
  const minBottom = Math.min(x.bottom, y.bottom);

  if (maxLeft <= minRight && maxTop <= minBottom) {
    return { left: maxLeft, top: maxTop, right: minRight, bottom: minBottom };
  }
}

export function intersectionRegion(x: IRegionInfo, y: IRegionInfo): IRegionInfo | undefined {
  const maxStartColumnIndex = Math.max(x.startColumnIndex, y.startColumnIndex);
  const minEndColumnIndex = Math.min(x.endColumnIndex, y.endColumnIndex);
  const maxStartRowIndex = Math.max(x.startRowIndex, y.startRowIndex);
  const minEndRowIndex = Math.min(x.endRowIndex, y.endRowIndex);

  if (maxStartColumnIndex <= minEndColumnIndex && maxStartRowIndex <= minEndRowIndex) {
    return {
      startColumnIndex: maxStartColumnIndex,
      startRowIndex: maxStartRowIndex,
      endColumnIndex: minEndColumnIndex,
      endRowIndex: minEndRowIndex,
    };
  }
}

export function splitIntoQuadrants(
  limit: Record<EQuadrantType, IRegionInfo>,
  region: IRegionInfo,
  activeCell?: ILocation,
): Map<EQuadrantType, TSelectionInfo<IRegionInfo>> {
  const originalActiveCellRegion: IRegionInfo | undefined = !activeCell
    ? undefined
    : {
        startRowIndex: activeCell.rowIndex,
        startColumnIndex: activeCell.columnIndex,
        endRowIndex: activeCell.rowIndex,
        endColumnIndex: activeCell.columnIndex,
      };

  const selectionRegion = new Map<EQuadrantType, TSelectionInfo<IRegionInfo>>();

  const cornerRegion = intersectionRegion(region, limit[EQuadrantType.CORNER]);
  if (cornerRegion) {
    selectionRegion.set(EQuadrantType.CORNER, [
      cornerRegion,
      originalActiveCellRegion ? intersectionRegion(originalActiveCellRegion, limit[EQuadrantType.CORNER]) : undefined,
    ]);
  }

  const topRegion = intersectionRegion(region, limit[EQuadrantType.TOP]);
  if (topRegion) {
    selectionRegion.set(EQuadrantType.TOP, [
      topRegion,
      originalActiveCellRegion ? intersectionRegion(originalActiveCellRegion, limit[EQuadrantType.TOP]) : undefined,
    ]);
  }

  const leftRegion = intersectionRegion(region, limit[EQuadrantType.LEFT]);
  if (leftRegion) {
    selectionRegion.set(EQuadrantType.LEFT, [
      leftRegion,
      originalActiveCellRegion ? intersectionRegion(originalActiveCellRegion, limit[EQuadrantType.LEFT]) : undefined,
    ]);
  }

  const mainRegion = intersectionRegion(region, limit[EQuadrantType.MAIN]);
  if (mainRegion) {
    selectionRegion.set(EQuadrantType.MAIN, [
      mainRegion,
      originalActiveCellRegion ? intersectionRegion(originalActiveCellRegion, limit[EQuadrantType.MAIN]) : undefined,
    ]);
  }

  return selectionRegion;
}

export function getIntersectionQuadrantRegion(
  container: IRegionInfo,
  selection: TSelectionInfo<IRegionInfo>,
): TSelectionInfo<IRegionInfo> | undefined {
  const [region, activeCell] = selection;

  const selectionRegion = intersectionRegion(container, region);
  if (!selectionRegion) return;

  if (!activeCell) return [selectionRegion, undefined];

  const activeCellRegion = intersectionRegion(container, activeCell);
  return [selectionRegion, activeCellRegion];
}

export function addLines(
  rect: IRectArea,
  lineType: TLineTypeMask,
  linePool: IShapePool<Konva.LineConfig, Konva.Line>,
  addCallback: (line$: Observable<Konva.Line>) => void,
) {
  const { top, left, right, bottom } = rect;

  if (lineType & ELineType.TOP) {
    const top$ = linePool.get$.pipe(
      switchMap(
        (getLine) =>
          new Observable<Konva.Line>((observer) => {
            const line = getLine({ points: [left, top, right, top] });

            observer.next(line);
            return () => {
              linePool.reuse(line);
            };
          }),
      ),
    );
    addCallback(top$);
  }

  if (lineType & ELineType.LEFT) {
    const left$ = linePool.get$.pipe(
      switchMap(
        (getLine) =>
          new Observable<Konva.Line>((observer) => {
            const line = getLine({ points: [left, top, left, bottom] });

            observer.next(line);
            return () => {
              linePool.reuse(line);
            };
          }),
      ),
    );
    addCallback(left$);
  }

  if (lineType & ELineType.RIGHT) {
    const right$ = linePool.get$.pipe(
      switchMap(
        (getLine) =>
          new Observable<Konva.Line>((observer) => {
            const line = getLine({ points: [right, top, right, bottom] });

            observer.next(line);
            return () => {
              linePool.reuse(line);
            };
          }),
      ),
    );
    addCallback(right$);
  }

  if (lineType & ELineType.BOTTOM) {
    const bottom$ = linePool.get$.pipe(
      switchMap(
        (getLine) =>
          new Observable<Konva.Line>((observer) => {
            const line = getLine({ points: [left, bottom, right, bottom] });

            observer.next(line);
            return () => {
              linePool.reuse(line);
            };
          }),
      ),
    );
    addCallback(bottom$);
  }
}

export function generateSelectionRenderInfo(
  area: TSelectionInfo<IRectArea>,
  lineType: TLineTypeMask,
  addCallback: (info: TRectRenderInfo<IRectArea>) => void,
): void {
  const [selection, activeCell] = area;

  if (!activeCell) {
    addCallback([selection, lineType, ERenderType.RECT]);
    return;
  }

  const activeTop = Math.max(activeCell.top, selection.top);
  const activeBottom = Math.min(activeCell.bottom, selection.bottom);
  const activeLeft = Math.max(activeCell.left, selection.left);
  const activeRight = Math.min(activeCell.right, selection.right);

  if (activeTop > activeBottom || activeLeft > activeRight) return;

  // Top region: above the active cell (full width)
  if (selection.top < activeTop) {
    const rect: IRectArea = {
      top: selection.top,
      bottom: activeTop,
      left: selection.left,
      right: selection.right,
    };
    addCallback([rect, lineType & ~ELineType.BOTTOM, ERenderType.RECT]);
  }

  // Bottom region: below the active cell (full width)
  if (activeBottom < selection.bottom) {
    const rect: IRectArea = {
      top: activeBottom,
      bottom: selection.bottom,
      left: selection.left,
      right: selection.right,
    };
    addCallback([rect, lineType & ~ELineType.TOP, ERenderType.RECT]);
  }

  // Left region: left of active cell (between top and bottom of active cell)
  if (selection.left < activeLeft) {
    const rect: IRectArea = {
      top: activeTop,
      bottom: activeBottom,
      left: selection.left,
      right: activeLeft,
    };

    let localLineType = lineType & ~ELineType.RIGHT;
    if (selection.top < activeTop) {
      localLineType &= ~ELineType.TOP;
    }
    if (activeBottom < selection.bottom) {
      localLineType &= ~ELineType.BOTTOM;
    }
    addCallback([rect, localLineType, ERenderType.RECT]);
  }

  // Right region: right of active cell (between top and bottom of active cell)
  if (activeRight < selection.right) {
    const rect: IRectArea = {
      top: activeTop,
      bottom: activeBottom,
      left: activeRight,
      right: selection.right,
    };

    let localLineType = lineType & ~ELineType.LEFT;
    if (selection.top < activeTop) {
      localLineType &= ~ELineType.TOP;
    }
    if (activeBottom < selection.bottom) {
      localLineType &= ~ELineType.BOTTOM;
    }
    addCallback([rect, localLineType, ERenderType.RECT]);
  }
}

export function generateActiveCellRenderInfo(
  region: TSelectionInfo<IRectArea>,
  lineType: TLineTypeMask,
  addCallback: (info: TRectRenderInfo<IRectArea>) => void,
): void {
  const [container, activeCell] = region;
  if (!activeCell) return;

  let localLineType = ELineType.EMPTY;
  const { left, top } = activeCell;
  const { left: cLeft, top: cTop, right: cRight, bottom: cBottom } = container;

  // ---- all directions ----

  if (top === cTop && lineType & ELineType.TOP) {
    localLineType |= ELineType.TOP;
  }

  if (left === cLeft && lineType & ELineType.LEFT) {
    localLineType |= ELineType.LEFT;
  }

  if (left === cRight && lineType & ELineType.RIGHT) {
    localLineType |= ELineType.RIGHT;
  }

  if (top === cBottom && lineType & ELineType.BOTTOM) {
    localLineType |= ELineType.BOTTOM;
  }

  // ---- inner ----

  if (cTop < top && top < cBottom) {
    localLineType |= ELineType.TOP | ELineType.BOTTOM;
  }

  if (cLeft < left && left < cRight) {
    localLineType |= ELineType.LEFT | ELineType.RIGHT;
  }

  addCallback([activeCell, localLineType, ERenderType.CELL]);
}

export function generateSubregionRenderInfo(
  [selection, activeCell]: TSelectionInfo<IRectArea>,
  lineType: TLineTypeMask,
  limit: IRectArea,
  addCallback: (info: TRectRenderInfo<IRectArea>) => void,
): void {
  const selectionArea = intersectionArea(selection, limit);
  if (!selectionArea) return;

  const activeCellArea = activeCell ? intersectionArea(activeCell, limit) : undefined;

  const intersection: TSelectionInfo<IRectArea> = [selectionArea, activeCellArea];
  if (!(activeCellArea && isSameArea(selectionArea, activeCellArea))) {
    generateSelectionRenderInfo(intersection, lineType, addCallback);
  }

  generateActiveCellRenderInfo(intersection, ELineType.ALL, addCallback);
}

export function findLineType(
  quadrantType: EQuadrantType,
  existedCallback: (type: EQuadrantType) => boolean,
): TLineTypeMask {
  let lineType: TLineTypeMask = ELineType.EMPTY;

  switch (quadrantType) {
    case EQuadrantType.CORNER:
      lineType = ELineType.TOP | ELineType.LEFT;
      if (!existedCallback(EQuadrantType.TOP)) {
        lineType |= ELineType.RIGHT;
      }
      if (!existedCallback(EQuadrantType.LEFT)) {
        lineType |= ELineType.BOTTOM;
      }
      break;
    case EQuadrantType.TOP:
      lineType = ELineType.TOP | ELineType.RIGHT;
      if (!existedCallback(EQuadrantType.CORNER)) {
        lineType |= ELineType.LEFT;
      }
      if (!existedCallback(EQuadrantType.MAIN)) {
        lineType |= ELineType.BOTTOM;
      }
      break;
    case EQuadrantType.LEFT:
      lineType = ELineType.LEFT | ELineType.BOTTOM;
      if (!existedCallback(EQuadrantType.CORNER)) {
        lineType |= ELineType.TOP;
      }
      if (!existedCallback(EQuadrantType.MAIN)) {
        lineType |= ELineType.RIGHT;
      }
      break;
    case EQuadrantType.MAIN:
      lineType = ELineType.BOTTOM | ELineType.RIGHT;
      if (!existedCallback(EQuadrantType.TOP)) {
        lineType |= ELineType.TOP;
      }
      if (!existedCallback(EQuadrantType.LEFT)) {
        lineType |= ELineType.LEFT;
      }
      break;
    default:
      throw new Error(`Invalid quadrant type: ${quadrantType}`);
  }

  return lineType;
}

export function correctRenderInfo(
  renderInfo: TRectRenderInfo<IRectArea>,
  wrapperArea: IRectArea,
): TRectRenderInfo<IRectArea> {
  const { left: oLeft, top: oTop, right: oRight, bottom: oBottom } = renderInfo[0];
  const { left: wLeft, top: wTop, right: wRight, bottom: wBottom } = wrapperArea;

  const left = oLeft >= wLeft ? oLeft : wLeft;
  const top = oTop >= wTop ? oTop : wTop;
  const right = oRight <= wRight ? oRight : wRight;
  const bottom = oBottom <= wBottom ? oBottom : wBottom;

  let localLineType: TLineTypeMask = renderInfo[1];
  if (oTop < wTop) {
    localLineType &= ~ELineType.TOP;
  }

  if (oBottom > wBottom) {
    localLineType &= ~ELineType.BOTTOM;
  }

  if (oLeft < wLeft) {
    localLineType &= ~ELineType.LEFT;
  }

  if (oRight > wRight) {
    localLineType &= ~ELineType.RIGHT;
  }

  console.log('correctRenderInfo', renderInfo[1], localLineType);

  return [{ left, top, right, bottom }, localLineType, renderInfo[2]];
}
