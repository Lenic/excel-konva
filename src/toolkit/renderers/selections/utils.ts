import type { IShapePool } from '../../pools';
import type { ILocation, IRectBox, IRegionInfo } from '../../types';
import type { IRectArea, TLineTypeMask, TRectRenderInfo, TSelectionInfo } from './types';
import type Konva from 'konva';

import { Observable, switchMap } from 'rxjs';

import { EQuadrantType, ERenderType } from './types';
import { ELineType } from './types';

/**
 * Checks if two rect areas are the same.
 * @param x The first rect area.
 * @param y The second rect area.
 * @returns True if they are the same, false otherwise.
 */
export function isSameArea(x?: IRectArea, y?: IRectArea): boolean {
  if (!x && !y) return true;
  if (!x || !y) return false;
  return x.top === y.top && x.left === y.left && x.bottom === y.bottom && x.right === y.right;
}

/**
 * Checks if two rect boxes are the same.
 * @param x The first rect box.
 * @param y The second rect box.
 * @returns True if they are the same, false otherwise.
 */
export function isSameRectBox(x: IRectBox, y: IRectBox): boolean {
  return x.x === y.x && x.y === y.y && x.width === y.width && x.height === y.height;
}

/**
 * Calculates the intersection of two pixel-based rect areas.
 * @param x First rect area.
 * @param y Second rect area.
 * @returns The overlapping area, or undefined if they don't intersect.
 */
export function intersectionArea(x: IRectArea, y: IRectArea): IRectArea | undefined {
  const maxLeft = Math.max(x.left, y.left);
  const minRight = Math.min(x.right, y.right);
  const maxTop = Math.max(x.top, y.top);
  const minBottom = Math.min(x.bottom, y.bottom);

  if (maxLeft <= minRight && maxTop <= minBottom) {
    return { left: maxLeft, top: maxTop, right: minRight, bottom: minBottom };
  }
}

/**
 * Adds selection border lines to the drawing callback based on the specified rect and line types.
 * @param rect The bounding box of the area to draw lines for.
 * @param lineType A bitmask indicating which edges (top, left, right, bottom) should be drawn.
 * @param linePool A pool for reusing Konva Line objects.
 * @param addCallback A callback function to handle the generated line observables.
 */
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

/**
 * Clips the render information against a wrapper area and updates the line types accordingly.
 * @param renderInfo The original rendering information (area, line mask, render type).
 * @param wrapperArea The boundary area to clip against.
 * @returns The corrected rendering information, or undefined if the area is completely outside the boundary.
 */
export function correctRenderInfo(renderInfo: TRectRenderInfo, wrapperArea: IRectArea): TRectRenderInfo | undefined {
  const { left: oLeft, top: oTop, right: oRight, bottom: oBottom } = renderInfo[0];
  const { left: wLeft, top: wTop, right: wRight, bottom: wBottom } = wrapperArea;

  const left = oLeft >= wLeft ? oLeft : wLeft;
  const top = oTop >= wTop ? oTop : wTop;
  const right = oRight <= wRight ? oRight : wRight;
  const bottom = oBottom <= wBottom ? oBottom : wBottom;

  if (left > right || top > bottom) return;

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

  return [{ left, top, right, bottom }, localLineType, renderInfo[2]];
}

/**
 * Calculates which border lines should be rendered for a specific quadrant.
 * It ensures that inner borders between adjacent quadrants are not drawn twice or incorrectly.
 * @param quadrantType The type of the current quadrant (Corner, Top, Left, or Main).
 * @param existedCallback A function to check if a specific quadrant exists in the current view.
 * @returns A bitmask of the lines to be rendered.
 */
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

/**
 * Splits a large selection region into up to four quadrants based on viewport limits.
 * This is typically used for handling frozen rows and columns.
 * @param limit A map defining the row/column index boundaries for each quadrant.
 * @param region The selection region to be split.
 * @param activeCell The active cell location within the selection.
 * @returns A map of quadrants and their corresponding selection/active cell info.
 */
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

/**
 * Generates rendering information for a selection subregion within a specific boundary.
 * It handles splitting the selection area around the active cell to avoid overlap.
 * @param selection The base selection rendering info.
 * @param activeCell The active cell rendering info, if any.
 * @param limit The boundary area (usually a quadrant's pixel area).
 * @param addCallback A callback to receive the generated rendering information chunks.
 */
export function generateSubregionRenderInfo(
  selection: TRectRenderInfo,
  activeCell: TRectRenderInfo | undefined,
  limit: IRectArea,
  addCallback: (info: TRectRenderInfo) => void,
): void {
  const selectionArea = intersectionArea(selection[0], limit);
  if (!selectionArea) return;

  const activeCellArea = activeCell ? intersectionArea(activeCell[0], limit) : undefined;

  const intersection: TSelectionInfo<IRectArea> = [selectionArea, activeCellArea];
  if (!(activeCellArea && isSameArea(selectionArea, activeCellArea))) {
    generateSelectionRenderInfo(intersection, selection[1], addCallback);
  }

  if (activeCell) {
    generateActiveCellRenderInfo(intersection, activeCell[1], addCallback);
  }
}

/**
 * Generates rendering information for the selection area.
 * If an active cell is present, it splits the selection into up to 4 rectangles surrounding the cell.
 * @param area A tuple containing the selection area and the active cell area.
 * @param lineType The bitmask of lines to draw for the outer border.
 * @param addCallback A callback to receive the generated rect areas for rendering.
 */
function generateSelectionRenderInfo(
  area: TSelectionInfo<IRectArea>,
  lineType: TLineTypeMask,
  addCallback: (info: TRectRenderInfo) => void,
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

/**
 * Generates rendering information for the active cell area.
 * It determines which borders of the active cell should be drawn based on its position relative to the selection container.
 * @param region A tuple containing the container area and the active cell area.
 * @param lineType The bitmask of lines assigned to the active cell.
 * @param addCallback A callback to receive the generated cell rendering info.
 */
function generateActiveCellRenderInfo(
  region: TSelectionInfo<IRectArea>,
  lineType: TLineTypeMask,
  addCallback: (info: TRectRenderInfo) => void,
): void {
  const [container, activeCell] = region;
  if (!activeCell) return;

  let localLineType = ELineType.EMPTY;
  const { left, top, right, bottom } = activeCell;
  const { left: cLeft, top: cTop, right: cRight, bottom: cBottom } = container;

  // ---- all directions ----

  if (top === cTop && lineType & ELineType.TOP) {
    localLineType |= ELineType.TOP;
  }

  if (left === cLeft && lineType & ELineType.LEFT) {
    localLineType |= ELineType.LEFT;
  }

  if (right === cRight && lineType & ELineType.RIGHT) {
    localLineType |= ELineType.RIGHT;
  }

  if (bottom === cBottom && lineType & ELineType.BOTTOM) {
    localLineType |= ELineType.BOTTOM;
  }

  // ---- inner ----

  if (cTop < top && top < cBottom) {
    localLineType |= ELineType.TOP;
  }

  if (cTop < bottom && bottom < cBottom) {
    localLineType |= ELineType.BOTTOM;
  }

  if (cLeft < left && left < cRight) {
    localLineType |= ELineType.LEFT;
  }

  if (cLeft < right && right < cRight) {
    localLineType |= ELineType.RIGHT;
  }

  addCallback([activeCell, localLineType, ERenderType.CELL]);
}

/**
 * Calculates the intersection of two index-based regions.
 * @param x First region.
 * @param y Second region.
 * @returns The overlapping region info, or undefined if they don't intersect.
 */
function intersectionRegion(x: IRegionInfo, y: IRegionInfo): IRegionInfo | undefined {
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
