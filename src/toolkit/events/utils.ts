import type { IBoundaryInfo } from './types';

import { combineLatest, map, switchMap, take } from 'rxjs';

import { container } from '../core-elements';
import { columnBoundary, config, rowBoundary, sheetDimension } from '../helpers';

import { RESIZE_TOLERANCE } from './constants';

/**
 * Check boundary information for the current position; return `null` if it's not a boundary.
 */
export const checkResizeBoundary$ = combineLatest([
  columnBoundary.getBoundary$.pipe(
    switchMap((getColumnLeft) =>
      columnBoundary.accumulated.dimension.get$.pipe(
        take(1),
        map((getColumnWidth) => [getColumnLeft, getColumnWidth] as const),
      ),
    ),
  ),
  rowBoundary.getBoundary$.pipe(
    switchMap((getRowTop) =>
      rowBoundary.accumulated.dimension.get$.pipe(
        take(1),
        map((getRowHeight) => [getRowTop, getRowHeight] as const),
      ),
    ),
  ),
  config.columnCount$,
  config.rowCount$,
  sheetDimension.visualSize$,
]).pipe(
  map(([[getColumnLeft, getColumnWidth], [getRowTop, getRowHeight], columnCount, rowCount, sheetVisualSize]) => {
    /**
     * Check boundary information for the current position; return `null` if it's not a boundary.
     *
     * @param clientX - The X coordinate of the mouse relative to the viewport.
     * @param clientY - The Y coordinate of the mouse relative to the viewport.
     */
    return function checkResizeBoundary(clientX: number, clientY: number): IBoundaryInfo | null {
      const containerRect = container.getBoundingClientRect();
      const relX = clientX - containerRect.left;
      const relY = clientY - containerRect.top;

      /**
       * Check column boundary
       *
       * - This event is only triggered within the column header area.
       * - It will not be triggered within the normal cell area.
       */
      if (relY < getRowHeight(0) + RESIZE_TOLERANCE) {
        for (let c = 0; c < columnCount; c++) {
          // Use getColumnLeft to get the precise coordinate value of the right edge of column c
          const boundary = getColumnLeft(c + 1);

          // If the difference between relX and the calculated boundary value is within the tolerance, it is considered a match
          if (Math.abs(relX - boundary) < RESIZE_TOLERANCE) {
            return { type: 'column-boundary', index: c, boundary };
          }

          // Out of viewport
          if (boundary > sheetVisualSize.width) break;
        }
      }

      /**
       * Check row boundary
       *
       * - This event is only triggered within the row header area.
       * - It will not be triggered within the normal cell area.
       */
      if (relX < getColumnWidth(0) + RESIZE_TOLERANCE) {
        for (let r = 0; r < rowCount; r++) {
          // Use getRowTop to get the precise coordinate value of the bottom edge of row r
          const boundary = getRowTop(r + 1);

          // If the difference between relY and the calculated boundary value is within the tolerance, it is considered a match
          if (Math.abs(relY - boundary) < RESIZE_TOLERANCE) {
            return { type: 'row-boundary', index: r, boundary: boundary };
          }

          // Out of viewport
          if (boundary > sheetVisualSize.height) break;
        }
      }

      return null;
    };
  }),
);
