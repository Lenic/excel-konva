import type { IKonvaItems, IPoint } from '../core';
import type { IAccumulatedDimensionManager } from '../data';
import type { ICursorListener } from './types';
import type { Observable } from 'rxjs';

import { EMPTY, filter, finalize, map, startWith, switchMap } from 'rxjs';

import { BaseListener } from './base-listener';

/**
 * Listener responsible for handling item (row/column) resizing interactions.
 * It monitors cursor movement and updates the cursor icon when hovering near boundaries.
 */
export class ResizeItemListener extends BaseListener {
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

  /**
   * Manager for calculating accumulated row heights and offsets.
   */
  private row: IAccumulatedDimensionManager;

  /**
   * Manager for calculating accumulated column widths and offsets.
   */
  private column: IAccumulatedDimensionManager;

  /**
   * Initializes a new instance of the ResizeItemListener.
   *
   * @param konvaItems - Collection of Konva objects for component management.
   * @param cursorListener - Service for monitoring cursor trajectory and events.
   * @param row - Manager for handling row-based accumulated dimensions.
   * @param column - Manager for handling column-based accumulated dimensions.
   * @param resizeTolerance$ - Observable stream providing the boundary detection sensitivity.
   */
  constructor(
    konvaItems: IKonvaItems,
    cursorListener: ICursorListener,
    row: IAccumulatedDimensionManager,
    column: IAccumulatedDimensionManager,
    resizeTolerance$: Observable<number>,
  ) {
    super();

    this.row = row;
    this.column = column;
    this.konvaItems = konvaItems;
    this.cursorListener = cursorListener;

    this.tolerance = 0;
    this.disposeWithMe(resizeTolerance$.subscribe((v) => void (this.tolerance = v)));

    this.disposeWithMe(
      this.activeSubject
        .pipe(
          switchMap((active) => {
            if (!active) return EMPTY;

            return this.cursorListener.change$.pipe(
              filter((v) => v.type === 'location'),
              map((v) => v.current),
              startWith(this.cursorListener.location),
              filter((location) => !location || location.rowIndex === 0 || location.columnIndex === 0),
              switchMap((location) => {
                if (!location) return EMPTY;

                if (location.rowIndex === 0) {
                  return this.buildItemResizeCursor$(this.column, location.columnIndex, COLUMN_RESIZE_CURSOR, 'x');
                } else {
                  return this.buildItemResizeCursor$(this.row, location.rowIndex, ROW_RESIZE_CURSOR, 'y');
                }
              }),
            );
          }),
        )
        .subscribe(),
    );
  }

  private buildItemResizeCursor$(
    dimensionManager: IAccumulatedDimensionManager,
    index: number,
    cursor: string,
    key: keyof IPoint,
  ) {
    const container = this.konvaItems.stage.container();

    const startValue = dimensionManager.get(index);
    const startMinusTolerance = startValue - this.tolerance;
    const startPlusTolerance = startValue + this.tolerance;

    const endValue = dimensionManager.get(index + 1);
    const endMinusTolerance = endValue - this.tolerance;
    const endPlusTolerance = endValue + this.tolerance;

    return this.cursorListener.change$.pipe(
      filter((v) => v.type === 'point'),
      map((v) => v.current),
      startWith(this.cursorListener.position),
      map((position) => {
        if (!position) {
          if (container.style.cursor !== cursor) {
            container.style.cursor = DEFAULT_CURSOR;
          }
          return;
        } else {
          const value = position[key];
          container.style.cursor =
            (startMinusTolerance <= value && value <= startPlusTolerance) ||
            (endMinusTolerance <= value && value <= endPlusTolerance)
              ? cursor
              : DEFAULT_CURSOR;
        }
      }),
      finalize(() => {
        container.style.cursor = DEFAULT_CURSOR;
      }),
    );
  }
}

const ROW_RESIZE_CURSOR = 'row-resize';
const COLUMN_RESIZE_CURSOR = 'col-resize';
const DEFAULT_CURSOR = 'default';
