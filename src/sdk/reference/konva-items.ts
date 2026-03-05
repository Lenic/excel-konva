import type { IDimension, ISheetConfig } from '../core';
import type { IKonvaItems, IRenderGroup } from './types';

import Konva from 'konva';
import { animationFrameScheduler, auditTime, fromEventPattern, Observable, tap } from 'rxjs';

import { ObservableDisposable } from '../utils';

import { EFreezeMode } from './types';

/**
 * Konva items
 */
export class KonvaItems extends ObservableDisposable implements IKonvaItems {
  stage: Konva.Stage;
  background: IRenderGroup;
  selection: IRenderGroup;
  resizeLine: Konva.Line;

  /**
   * Create a new instance of KonvaItems
   * @param konvaContainer - Konva container
   * @param scrollContainer - Scroll container
   * @param config - Sheet config
   */
  constructor(konvaContainer: HTMLDivElement, scrollContainer: HTMLDivElement, config: ISheetConfig) {
    super();

    this.stage = new Konva.Stage({ container: konvaContainer, width: 0, height: 0 });
    this.disposeWithMe(() => {
      this.stage.off().destroy();
      this.stage = undefined as unknown as Konva.Stage;
    });

    const containerResize$ = new Observable<IDimension>((observer) => {
      const listener = new ResizeObserver((entries) => {
        for (const entry of entries) {
          observer.next({ width: entry.contentRect.width, height: entry.contentRect.height });
        }
      });
      listener.observe(konvaContainer);
      observer.next({ width: konvaContainer.clientWidth, height: konvaContainer.clientHeight });

      return () => {
        listener.disconnect();
      };
    });
    this.disposeWithMe(
      containerResize$.pipe(auditTime(16, animationFrameScheduler)).subscribe((dim) => {
        this.stage.setAttrs(dim);
      }),
    );

    // Connect Canvas wheel events to scroll container scroll events
    this.disposeWithMe(
      fromEventPattern<Konva.KonvaEventObject<WheelEvent>>(
        (fn) => this.stage.on('wheel', fn),
        (fn) => this.stage.off('wheel', fn),
      )
        .pipe(
          tap((e) => {
            e.evt.preventDefault();
          }),
        )
        .subscribe((e) => {
          scrollContainer.scrollTop = Math.max(0, scrollContainer.scrollTop + e.evt.deltaY);
          scrollContainer.scrollLeft = Math.max(0, scrollContainer.scrollLeft + e.evt.deltaX);
        }),
    );

    this.background = {
      layer: new Konva.Layer(),
      groups: {
        [EFreezeMode.NONE]: new Konva.Group(),
        [EFreezeMode.ROW]: new Konva.Group(),
        [EFreezeMode.COLUMN]: new Konva.Group(),
        [EFreezeMode.BOTH]: new Konva.Group(),
      },
    };
    this.disposeWithMe(() => {
      this.background.groups[EFreezeMode.NONE].destroy();
      this.background.groups[EFreezeMode.ROW].destroy();
      this.background.groups[EFreezeMode.COLUMN].destroy();
      this.background.groups[EFreezeMode.BOTH].destroy();

      this.background.layer.destroy();
      this.background = undefined as unknown as IRenderGroup;
    });
    this.stage.add(this.background.layer);
    this.background.layer.add(
      this.background.groups[EFreezeMode.NONE],
      this.background.groups[EFreezeMode.ROW],
      this.background.groups[EFreezeMode.COLUMN],
      this.background.groups[EFreezeMode.BOTH],
    );

    this.selection = {
      layer: new Konva.Layer(),
      groups: {
        [EFreezeMode.NONE]: new Konva.Group(),
        [EFreezeMode.ROW]: new Konva.Group(),
        [EFreezeMode.COLUMN]: new Konva.Group(),
        [EFreezeMode.BOTH]: new Konva.Group(),
      },
    };
    this.disposeWithMe(() => {
      this.selection.groups[EFreezeMode.NONE].destroy();
      this.selection.groups[EFreezeMode.ROW].destroy();
      this.selection.groups[EFreezeMode.COLUMN].destroy();
      this.selection.groups[EFreezeMode.BOTH].destroy();

      this.selection.layer.destroy();
      this.selection = undefined as unknown as IRenderGroup;
    });
    this.stage.add(this.selection.layer);
    this.selection.layer.add(
      this.selection.groups[EFreezeMode.NONE],
      this.selection.groups[EFreezeMode.ROW],
      this.selection.groups[EFreezeMode.COLUMN],
      this.selection.groups[EFreezeMode.BOTH],
    );

    /**
     * Helper line for resizing by dragging
     */
    this.resizeLine = new Konva.Line({
      points: [0, 0, 0, 0],
      stroke: config.options.resizeLineColor,
      strokeWidth: 2,
      dash: [4, 4],
      visible: false,
      listening: false,
    });
    this.disposeWithMe(() => {
      this.resizeLine.destroy();
      this.resizeLine = undefined as unknown as Konva.Line;
    });
    this.selection.layer.add(this.resizeLine);
    this.disposeWithMe(
      config.get$('resizeLineColor').subscribe((color) => {
        this.resizeLine.stroke(color);
        this.selection.layer.batchDraw();
      }),
    );
  }
}
