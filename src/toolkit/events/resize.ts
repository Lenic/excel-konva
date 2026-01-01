import type { IItemBoundary, ISheetConfig, ISheetDimension } from '../helpers';
import type { IBoundaryResize, IStageMouseEvent } from './types';
import type { Subscription } from 'rxjs';

import { EMPTY, finalize, of, switchMap, takeUntil, tap, withLatestFrom } from 'rxjs';

import { Disposable } from '../core';
import { resizeLine, selectionLayer, stage } from '../konva-items';

import { EBoundaryTypes, EMousedownTypes } from './types';

/**
 * Boundary resize
 */
export class BoundaryResize extends Disposable implements IBoundaryResize {
  private subscription: Subscription | null;

  config: ISheetConfig;
  sheetDimension: ISheetDimension;
  columnBoundary: IItemBoundary;
  rowBoundary: IItemBoundary;
  events: IStageMouseEvent;

  /**
   * Constructor
   * @param config sheet config
   * @param sheetDimension sheet dimension
   * @param columnBoundary column boundary
   * @param rowBoundary row boundary
   * @param events stage mouse events
   */
  constructor(
    config: ISheetConfig,
    sheetDimension: ISheetDimension,
    columnBoundary: IItemBoundary,
    rowBoundary: IItemBoundary,
    events: IStageMouseEvent,
  ) {
    super();

    this.subscription = null;

    this.config = config;
    this.sheetDimension = sheetDimension;
    this.columnBoundary = columnBoundary;
    this.rowBoundary = rowBoundary;
    this.events = events;

    this.disposeWithMe(this.destroySubscription);
  }

  startListening(): () => void {
    if (this.subscription) return this.destroySubscription;

    this.subscription = this.build().subscribe();
    return this.destroySubscription;
  }

  private destroySubscription = () => {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  };

  private build() {
    return this.dispositionSubject.pipe(
      switchMap(() => this.events.typedMouseDownLeft$),
      switchMap((v) => (v.mousedownType === EMousedownTypes.ResizeBoundary ? of([v.data, v.event] as const) : EMPTY)),
      withLatestFrom(
        this.columnBoundary.accumulated.dimension.get$,
        this.rowBoundary.accumulated.dimension.get$,
        this.sheetDimension.visualSize$,
        this.columnBoundary.getBoundary$,
        this.rowBoundary.getBoundary$,
        this.config.minRowHeight$,
        this.config.minColumnWidth$,
      ),
      switchMap(
        ([
          [info, e],
          getColumnWidth,
          getRowHeight,
          sheetVisualSize,
          getColumnLeft,
          getRowTop,
          minRowHeight,
          minColumnWidth,
        ]) => {
          // 阻止默认的 mousedown 行为
          e.evt.preventDefault();
          // 设置当前的鼠标样式
          stage.container().style.cursor = info.type === EBoundaryTypes.Column ? 'col-resize' : 'row-resize';

          let initialDimension = 0;
          if (info.type === EBoundaryTypes.Column) {
            initialDimension = getColumnWidth(info.index);
            resizeLine.points([info.boundary, 0, info.boundary, sheetVisualSize.height]);
          } else {
            initialDimension = getRowHeight(info.index);
            resizeLine.points([0, info.boundary, sheetVisualSize.width, info.boundary]);
          }
          resizeLine.visible(true);

          selectionLayer.batchDraw();

          const clear$ = this.events.mouseUp$.pipe(
            tap((ue) => {
              resizeLine.visible(false);

              if (info.type === EBoundaryTypes.Column) {
                const dx = ue.evt.clientX - e.evt.clientX;
                const newWidth = Math.max(initialDimension + dx, minColumnWidth);
                this.columnBoundary.accumulated.dimension.set(info.index, Math.round(newWidth));
              } else {
                const dy = ue.evt.clientY - e.evt.clientY;
                const newHeight = Math.max(initialDimension + dy, minRowHeight);
                this.rowBoundary.accumulated.dimension.set(info.index, newHeight);
              }
            }),
            finalize(() => {
              stage.container().style.cursor = 'default';
            }),
          );

          return this.events.mouseMove$.pipe(
            takeUntil(clear$),
            tap((me) => {
              if (info.type === EBoundaryTypes.Column) {
                const dx = me.evt.clientX - e.evt.clientX;
                const newWidth = Math.max(initialDimension + dx, minColumnWidth);

                // 实时更新辅助线位置 (获取该列右边界的当前位置，然后加上尺寸变化)
                const currentBoundaryX = getColumnLeft(info.index + 1);
                const widthDelta = newWidth - initialDimension;
                const newX = currentBoundaryX + widthDelta;

                resizeLine.points([newX, 0, newX, sheetVisualSize.height]);
              } else {
                const dy = me.evt.clientY - e.evt.clientY;
                const newHeight = Math.max(initialDimension + dy, minRowHeight);

                // 实时更新辅助线位置 (获取该行下边界的当前位置，然后加上尺寸变化)
                const currentBoundaryY = getRowTop(info.index + 1);
                const heightDelta = newHeight - initialDimension;
                const newY = currentBoundaryY + heightDelta;

                resizeLine.points([0, newY, sheetVisualSize.width, newY]);
              }
              selectionLayer.batchDraw();
            }),
          );
        },
      ),
    );
  }
}
