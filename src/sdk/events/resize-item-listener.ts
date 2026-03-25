import type { IKonvaItems, ILocation, IPoint } from '../core';
import type { IAccumulatedDimensionManager, IDimensionManager } from '../data';
import type { ICellBoxManager, ISheetDimension } from '../ui';
import type { ICursorListener, IStageMouseEvent } from './types';
import type { Observable } from 'rxjs';

import { distinctUntilChanged, EMPTY, filter, finalize, map, merge, scan, startWith, switchMap, tap } from 'rxjs';

import { BaseListener } from './base-listener';

/**
 * Listener responsible for handling item (row/column) resizing interactions.
 * It monitors cursor movement and updates the cursor icon when hovering near boundaries.
 */
export class ResizeItemListener extends BaseListener {
  /**
   * Mouse events service for monitoring cursor trajectory and events.
   */
  private mouseEvents: IStageMouseEvent;

  /**
   * The sensitivity range (in pixels) for triggering resize boundaries.
   */
  private tolerance: number;

  /**
   * Collection of Konva objects, used to access the stage container for cursor updates.
   */
  private konvaItems: IKonvaItems;

  /**
   * Service tracking cursor coordinates and grid-relative location.
   */
  private cursorListener: ICursorListener;

  private row: IDimensionManager;
  private column: IDimensionManager;

  /**
   * Manager for calculating accumulated row heights and offsets.
   */
  private rowA: IAccumulatedDimensionManager;

  /**
   * Manager for calculating accumulated column widths and offsets.
   */
  private columnA: IAccumulatedDimensionManager;

  private cell: ICellBoxManager;

  /**
   * Manager for calculating accumulated sheet dimensions and offsets.
   */
  private sheetDimension: ISheetDimension;

  /**
   * Initializes a new instance of the ResizeItemListener.
   *
   * @param konvaItems - Collection of Konva objects for component management.
   * @param cursorListener - Service for monitoring cursor trajectory and events.
   * @param rowA - Manager for handling row-based accumulated dimensions.
   * @param columnA - Manager for handling column-based accumulated dimensions.
   * @param resizeTolerance$ - Observable stream providing the boundary detection sensitivity.
   */
  constructor(
    konvaItems: IKonvaItems,
    cursorListener: ICursorListener,
    row: IDimensionManager,
    column: IDimensionManager,
    rowA: IAccumulatedDimensionManager,
    columnA: IAccumulatedDimensionManager,
    resizeTolerance$: Observable<number>,
    mouseEvents: IStageMouseEvent,
    sheetDimension: ISheetDimension,
    cell: ICellBoxManager,
  ) {
    super();

    this.cell = cell;
    this.row = row;
    this.column = column;
    this.rowA = rowA;
    this.columnA = columnA;
    this.konvaItems = konvaItems;
    this.mouseEvents = mouseEvents;
    this.cursorListener = cursorListener;
    this.sheetDimension = sheetDimension;

    window.column = column;
    window.row = row;

    this.tolerance = 0;
    this.disposeWithMe(resizeTolerance$.subscribe((v) => void (this.tolerance = v)));

    const container = this.konvaItems.stage.container();
    this.disposeWithMe(
      this.activeSubject
        .pipe(
          switchMap((active) => {
            if (!active) return EMPTY;

            const mouseupEvent = { type: 'up' } as const;
            const mousedownEvent = { type: 'down' } as const;
            return merge(
              this.cursorListener.change$.pipe(
                filter((v) => v.type === 'point'),
                map((v) => ({ type: 'move', pos: v.current }) as const),
              ),
              this.mouseEvents.mousedown$.pipe(
                tap(() => void this.konvaItems.resizeLine.visible(true)),
                map(() => mousedownEvent),
              ),
              this.mouseEvents.mouseUp$.pipe(
                tap(() => void this.konvaItems.resizeLine.visible(false)),
                map(() => mouseupEvent),
              ),
            ).pipe(
              scan(
                (state: IResizeState, event) => {
                  if (state.isDragging && event.type === 'up') return { ...state, isDragging: false };
                  if (!state.isDragging && event.type === 'down' && state.target) return { ...state, isDragging: true };

                  if (!state.isDragging && event.type === 'move') {
                    return { ...state, target: this.getTargetInformation(event.pos, this.cursorListener.location) };
                  }

                  return state;
                },
                { isDragging: false, target: null } as IResizeState,
              ),
              distinctUntilChanged(),
              switchMap((state) => {
                const cursor = state.target?.cursor ?? DEFAULT_CURSOR;
                if (!state.isDragging && container.style.cursor !== cursor) {
                  container.style.cursor = cursor;
                } else if (state.isDragging && container.style.cursor !== cursor) {
                  container.style.cursor = cursor;
                }

                if (state.isDragging && state.target) {
                  return this.onResizeItem(state.target);
                }

                return EMPTY;
              }),
              finalize(() => {
                container.style.cursor = DEFAULT_CURSOR;
              }),
            );
          }),
        )
        .subscribe(),
    );
  }

  private getTargetInformation(point: IPoint | null, location: ILocation | null): ITargetInformation | null {
    if (!point || !location) return null;

    const targetRowIndex =
      location.rowIndex === 0 ? this.getTargetIndex(point.x, this.columnA, location.columnIndex) : -1;
    const targetColumnIndex =
      location.columnIndex === 0 ? this.getTargetIndex(point.y, this.rowA, location.rowIndex) : -1;

    if (targetRowIndex !== -1 && targetColumnIndex === -1) {
      return { index: targetRowIndex, key: 'x', cursor: COLUMN_RESIZE_CURSOR };
    }

    if (targetColumnIndex !== -1 && targetRowIndex === -1) {
      return { index: targetColumnIndex, key: 'y', cursor: ROW_RESIZE_CURSOR };
    }

    return null;
  }

  private getTargetIndex(value: number, dimension: IAccumulatedDimensionManager, index: number): number {
    const start = dimension.get(index);
    if (value >= start - this.tolerance && value <= start + this.tolerance) return index - 1;

    const end = dimension.get(index + 1);
    if (value >= end - this.tolerance && value <= end + this.tolerance) return index;

    return -1;
  }

  private onResizeItem(target: ITargetInformation) {
    this.konvaItems.resizeLine.moveToTop();

    return this.cursorListener.change$.pipe(
      filter((v) => v.type === 'point'),
      map((v) => v.current),
      startWith(this.cursorListener.position),
      tap((position) => {
        if (!position) return;

        if (target.key === 'x') {
          const x = Math.round(position.x);
          this.konvaItems.resizeLine.points([x, 0, x, this.sheetDimension.height]);
        } else {
          const y = Math.round(position.y);
          this.konvaItems.resizeLine.points([0, y, this.sheetDimension.width, y]);
        }

        this.konvaItems.selection.layer.batchDraw();
      }),
      finalize(() => {
        if (target.key === 'x') {
          const endValue = this.cursorListener.position?.x ?? -1;
          if (endValue !== -1) {
            const beginValue = this.cell.getCellBox(0, target.index).x;
            this.column.set(target.index, endValue - beginValue);
          }
        } else {
          const endValue = this.cursorListener.position?.y ?? -1;
          if (endValue !== -1) {
            const beginValue = this.cell.getCellBox(target.index, 0).y;
            this.row.set(target.index, endValue - beginValue);
          }
        }
        this.konvaItems.selection.layer.batchDraw();
      }),
    );
  }
}

interface ITargetInformation {
  index: number;
  key: keyof IPoint;
  cursor: string;
}

interface IResizeState {
  isDragging: boolean;
  target: ITargetInformation | null;
}

const ROW_RESIZE_CURSOR = 'row-resize';
const COLUMN_RESIZE_CURSOR = 'col-resize';
const DEFAULT_CURSOR = 'default';
