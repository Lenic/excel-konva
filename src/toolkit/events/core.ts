import type { IBoundaryInfo, TMousedownEvent } from './types';
import type Konva from 'konva';

import {
  combineLatest,
  EMPTY,
  exhaustMap,
  fromEventPattern,
  map,
  of,
  shareReplay,
  switchMap,
  take,
  withLatestFrom,
} from 'rxjs';

import { container } from '../core-elements';
import { itemBoundary, sheet, sheetDimension } from '../helpers';
import { stage } from '../konva-items';

import { MousedownTypes, RESIZE_TOLERANCE } from './constants';

function getMouseEvent$(key: keyof GlobalEventHandlersEventMap) {
  return fromEventPattern<Konva.KonvaEventObject<MouseEvent>>(
    (fn) => stage.on(key, fn),
    (fn) => stage.off(key, fn),
  ).pipe(shareReplay({ refCount: true, bufferSize: 1 }));
}

export const mouseDown$ = getMouseEvent$('mousedown');
export const mouseMove$ = getMouseEvent$('mousemove');
export const mouseUp$ = getMouseEvent$('mouseup');

/**
 * 检查当前位置的边界信息，如果不是边界就返回 `null`
 */
const checkResizeBoundary$ = combineLatest([
  itemBoundary.getColumnLeft$.pipe(
    switchMap((getColumnLeft) =>
      itemBoundary.column.get$.pipe(
        take(1),
        map((getColumnWidth) => [getColumnLeft, getColumnWidth] as const),
      ),
    ),
  ),
  itemBoundary.getRowTop$.pipe(
    switchMap((getRowTop) =>
      itemBoundary.row.get$.pipe(
        take(1),
        map((getRowHeight) => [getRowTop, getRowHeight] as const),
      ),
    ),
  ),
  sheet.columnCount$,
  sheet.rowCount$,
  sheetDimension.visualSize$,
]).pipe(
  map(([[getColumnLeft, getColumnWidth], [getRowTop, getRowHeight], columnCount, rowCount, sheetVisualSize]) => {
    /**
     * 检查当前位置的边界信息，如果不是边界就返回 `null`
     *
     * @param relX - 当前鼠标相对于画布左上角的横坐标
     * @param relY - 当前鼠标相对于画布左上角的纵坐标
     */
    return function checkResizeBoundary(relX: number, relY: number): IBoundaryInfo | null {
      /**
       * 检查列边界
       *
       * - 只有列头区域内才会触发这个事件
       * - 在正常的单元格区域内不会触发列边界 resize 事件
       */
      if (relY < getRowHeight(0) + RESIZE_TOLERANCE) {
        for (let c = 0; c < columnCount; c++) {
          // 使用 getColumnLeft 获取列 c 右侧边界的准确坐标值
          const boundary = getColumnLeft(c + 1);

          // relX 和 计算出来的边界值 boundary 差值在容差允许的范围内即认为匹配成功
          if (Math.abs(relX - boundary) < RESIZE_TOLERANCE) {
            return { type: 'column-boundary', index: c, boundary };
          }

          // 超出视口
          if (boundary > sheetVisualSize.width) break;
        }
      }

      /**
       * 检查行边界
       *
       * - 只有行头区域内才会触发这个事件
       * - 在正常的单元格区域内不会触发行边界 resize 事件
       */
      if (relX < getColumnWidth(0) + RESIZE_TOLERANCE) {
        for (let r = 0; r < rowCount; r++) {
          // 使用 getRowTop 获取行 r 底部边界的准确坐标值
          const boundary = getRowTop(r + 1);

          // relY 和 计算出来的边界值 boundary 差值在容差允许的范围内即认为匹配成功
          if (Math.abs(relY - boundary) < RESIZE_TOLERANCE) {
            return { type: 'row-boundary', index: r, boundary: boundary };
          }

          // 超出视口
          if (boundary > sheetVisualSize.height) break;
        }
      }

      return null;
    };
  }),
);

export const typedLeftMouseDown$ = mouseDown$.pipe(
  exhaustMap((e) => (e.evt.button === 0 ? of(e) : EMPTY)),
  withLatestFrom(checkResizeBoundary$),
  map(([e, checkResizeBoundary]) => {
    const containerRect = container.getBoundingClientRect();
    const relX = e.evt.clientX - containerRect.left;
    const relY = e.evt.clientY - containerRect.top;

    const boundary = checkResizeBoundary(relX, relY);
    if (boundary) {
      return { mousedownType: MousedownTypes.ResizeBoundary, data: boundary, event: e } as TMousedownEvent;
    }

    return { mousedownType: MousedownTypes.Empty, event: e } as TMousedownEvent;
  }),
  shareReplay({ refCount: true, bufferSize: 1 }),
);
