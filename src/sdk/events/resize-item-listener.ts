import type { IKonvaItems, ILocation, IPoint, IScrollOffset, ISheetConfig } from '../core';
import type { IAccumulatedDimensionManager, IDimensionManager } from '../data';
import type { IFrozenInformation, IInformationManager, ISheetDimension } from '../ui';
import type { ICursorListener, IStageMouseEvent } from './types';

import { distinctUntilChanged, EMPTY, filter, finalize, map, merge, scan, startWith, switchMap, tap } from 'rxjs';

import { BaseListener } from './base-listener';

/**
 * Listener responsible for handling item (row/column) resizing interactions.
 * It monitors cursor movement and updates the cursor icon when hovering near boundaries.
 */
export class ResizeItemListener extends BaseListener {
  private row: IDimensionManager;
  private scoller: IScrollOffset;
  private konvaItems: IKonvaItems;
  private column: IDimensionManager;
  private sheetConfig: ISheetConfig;
  private mouseEvents: IStageMouseEvent;
  private sheetDimension: ISheetDimension;
  private cursorListener: ICursorListener;
  private rowA: IAccumulatedDimensionManager;
  private columnA: IAccumulatedDimensionManager;
  private frozenInformation: IInformationManager<IFrozenInformation>;

  /**
   * Initializes a new instance of the ResizeItemListener.
   *
   * @param row - Manager for handling row dimensions.
   * @param scoller - Service for handling scroll offsets.
   * @param konvaItems - Collection of Konva objects for component management.
   * @param column - Manager for handling column dimensions.
   * @param sheetConfig - Configuration for the sheet.
   * @param mouseEvents - Service for handling mouse events.
   * @param sheetDimension - Manager for handling sheet dimensions.
   * @param cursorListener - Service for monitoring cursor trajectory and events.
   * @param rowA - Manager for handling row-based accumulated dimensions.
   * @param columnA - Manager for handling column-based accumulated dimensions.
   * @param frozenInformation - Manager for handling frozen information.
   */
  constructor(
    row: IDimensionManager,
    scoller: IScrollOffset,
    konvaItems: IKonvaItems,
    column: IDimensionManager,
    sheetConfig: ISheetConfig,
    mouseEvents: IStageMouseEvent,
    sheetDimension: ISheetDimension,
    cursorListener: ICursorListener,
    rowA: IAccumulatedDimensionManager,
    columnA: IAccumulatedDimensionManager,
    frozenInformation: IInformationManager<IFrozenInformation>,
  ) {
    super();

    this.row = row;
    this.rowA = rowA;
    this.column = column;
    this.columnA = columnA;
    this.scoller = scoller;
    this.konvaItems = konvaItems;
    this.mouseEvents = mouseEvents;
    this.sheetConfig = sheetConfig;
    this.cursorListener = cursorListener;
    this.sheetDimension = sheetDimension;
    this.frozenInformation = frozenInformation;

    const container = this.konvaItems.stage.container();
    this.disposeWithMe(
      this.activeSubject
        .pipe(
          switchMap((active) => {
            if (!active) return EMPTY;

            const state$ = merge(
              this.cursorListener.change$.pipe(
                filter((v) => v.type === 'point'),
                map((v) => ({ type: 'move', pos: v.current }) as const),
              ),
              this.mouseEvents.mousedown$.pipe(
                tap(() => {
                  this.konvaItems.resizeLine.visible(true);
                  this.konvaItems.selection.layer.batchDraw();
                }),
                map(() => ({ type: 'down' }) as const),
              ),
              this.mouseEvents.mouseUp$.pipe(
                tap(() => {
                  this.konvaItems.resizeLine.visible(false);
                  this.konvaItems.selection.layer.batchDraw();
                }),
                map(() => {
                  const { position } = this.cursorListener;
                  if (!position) {
                    throw new Error('[ResizeItemListener]: position is not found.');
                  }
                  return { type: 'up', pos: position } as const;
                }),
              ),
            ).pipe(
              scan(
                (state: IResizeState, event) => {
                  if (event.type === 'up') {
                    let nextTarget = state.target;
                    if (nextTarget) {
                      const { location } = this.cursorListener;
                      if (nextTarget.key === 'x' && location?.rowIndex === 0) {
                        nextTarget = { ...nextTarget, beginValue: event.pos.x };
                      } else if (nextTarget.key === 'y' && location?.columnIndex === 0) {
                        nextTarget = { ...nextTarget, beginValue: event.pos.y };
                      } else {
                        nextTarget = null;
                      }
                    }

                    return {
                      ...state,
                      isDragging: false,
                      target: nextTarget,
                    };
                  }

                  if (event.type === 'down' && state.target) {
                    return {
                      ...state,
                      isDragging: true,
                    };
                  }

                  if (!state.isDragging && event.type === 'move') {
                    return {
                      ...state,
                      target: this.getTargetInformation(event.pos, this.cursorListener.location),
                    };
                  }

                  return state;
                },
                { isDragging: false, target: null } as IResizeState,
              ),
              distinctUntilChanged((x, y) => {
                if (x === y) return true;
                if (x.isDragging !== y.isDragging) return false;
                if (x.target === y.target) return true;
                if (!x.target || !y.target) return false;

                const prev = x.target;
                const curr = y.target;
                return prev.cursor === curr.cursor && prev.index === curr.index && prev.key === curr.key;
              }),
              this.withPublish(),
            );

            const cursor$ = state$.pipe(
              map((state) => state.target?.cursor ?? DEFAULT_CURSOR),
              distinctUntilChanged(),
              tap((cursor) => {
                container.style.cursor = cursor;
              }),
              finalize(() => {
                container.style.cursor = DEFAULT_CURSOR;
              }),
            );

            const resize$ = state$.pipe(
              switchMap((v) => (v.isDragging && v.target ? this.onResizeItem(v.target) : EMPTY)),
            );

            return merge(cursor$, resize$);
          }),
        )
        .subscribe(),
    );
  }

  private getTargetInformation(point: IPoint | null, location: ILocation | null): ITargetInformation | null {
    if (!point || !location) return null;

    let topValue = -1;
    let targetRowIndex = -1;
    if (location.columnIndex === 0) {
      const isInFrozenRegion = point.y <= this.frozenInformation.value.height;
      [targetRowIndex, topValue] = this.correctItemIndex(
        isInFrozenRegion ? point.y : point.y + this.scoller.top,
        this.rowA,
        location.rowIndex,
        isInFrozenRegion ? 0 : this.scoller.top,
      );
    }

    let leftValue = -1;
    let targetColumnIndex = -1;
    if (location.rowIndex === 0) {
      const isInFrozenRegion = point.x <= this.frozenInformation.value.width;
      [targetColumnIndex, leftValue] = this.correctItemIndex(
        isInFrozenRegion ? point.x : point.x + this.scoller.left,
        this.columnA,
        location.columnIndex,
        isInFrozenRegion ? 0 : this.scoller.left,
      );
    }

    if (targetRowIndex !== -1 && targetColumnIndex === -1) {
      return {
        index: targetRowIndex,
        key: 'y',
        cursor: ROW_RESIZE_CURSOR,
        beginValue: point.y,
        edgeValue: topValue,
      };
    }

    if (targetColumnIndex !== -1 && targetRowIndex === -1) {
      return {
        index: targetColumnIndex,
        key: 'x',
        cursor: COLUMN_RESIZE_CURSOR,
        beginValue: point.x,
        edgeValue: leftValue,
      };
    }

    return null;
  }

  private correctItemIndex(
    value: number,
    dimension: IAccumulatedDimensionManager,
    index: number,
    correction: number,
  ): [targetIndex: number, edgeValue: number] {
    const tolerance = this.sheetConfig.options.resizeTolerance;
    if (index === 0 && value <= tolerance) return [-1, 0];

    const previous = index - 1;
    const start = dimension.get(index);
    if (value >= start && value <= start + tolerance)
      return [previous, previous < 0 ? 0 : dimension.get(previous) - correction];

    const end = dimension.get(index + 1);
    if (value >= end - tolerance && value <= end) return [index, start - correction];

    return [-1, 0];
  }

  private onResizeItem(target: ITargetInformation) {
    this.konvaItems.resizeLine.moveToTop();

    let lastValue = -1;
    return this.cursorListener.change$.pipe(
      filter((v) => v.type === 'point'),
      map((v) => v.current),
      startWith(this.cursorListener.position),
      tap((position) => {
        if (!position) return;

        if (target.key === 'x') {
          if (position.x - target.edgeValue >= this.sheetConfig.options.minimalColumnWidth) {
            lastValue = position.x;
            this.konvaItems.resizeLine.points([position.x, 0, position.x, this.sheetDimension.height]);
            this.konvaItems.selection.layer.batchDraw();
          }
        } else {
          if (position.y - target.edgeValue >= this.sheetConfig.options.minimalRowHeight) {
            lastValue = position.y;
            this.konvaItems.resizeLine.points([0, position.y, this.sheetDimension.width, position.y]);
            this.konvaItems.selection.layer.batchDraw();
          }
        }
      }),
      finalize(() => {
        if (lastValue === -1) return;

        if (target.key === 'x') {
          const width = this.column.get(target.index);
          this.column.set(
            target.index,
            Math.max(this.sheetConfig.options.minimalColumnWidth, width + (lastValue - target.beginValue)),
          );
        } else {
          const height = this.row.get(target.index);
          this.row.set(
            target.index,
            Math.max(this.sheetConfig.options.minimalRowHeight, height + (lastValue - target.beginValue)),
          );
        }
        lastValue = -1;
        this.konvaItems.selection.layer.batchDraw();
      }),
    );
  }
}

interface ITargetInformation {
  index: number;
  key: keyof IPoint;
  cursor: string;
  beginValue: number;
  edgeValue: number;
}

interface IResizeState {
  isDragging: boolean;
  target: ITargetInformation | null;
}

const ROW_RESIZE_CURSOR = 'row-resize';
const COLUMN_RESIZE_CURSOR = 'col-resize';
const DEFAULT_CURSOR = 'default';
