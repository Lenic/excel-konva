import type { ICellRange, IKonvaItems } from '../core';
import type { IViewportManager } from '../ui';
import type { Observable } from 'rxjs';

import { combineLatest, combineLatestAll, filter, finalize, from, map, startWith } from 'rxjs';

import { BaseListener, EFreezeMode } from '../core';

import { CollectionSubscription } from './subscription';

/**
 * Abstract base class for implementing rendering logic across different viewports.
 * Manages the lifecycle and core rendering pipeline for viewport-specific content.
 */
export abstract class BaseRenderer extends BaseListener {
  /**
   * Manager providing access to different viewport instances.
   */
  protected viewportManager: IViewportManager;
  /**
   * Access to the Konva stage, layers, and groups.
   */
  protected konvaItems: IKonvaItems;

  /**
   * Initializes the base renderer with required managers.
   *
   * @param viewportManager - The manager for sheet viewports.
   * @param konvaItems - The items for Konva stage and groups.
   */
  constructor(viewportManager: IViewportManager, konvaItems: IKonvaItems) {
    super();

    this.viewportManager = viewportManager;
    this.konvaItems = konvaItems;
  }

  protected activate() {
    return from(viewportModes).pipe(
      map((freezeMode) => this.buildSingleViewport(freezeMode)),
      combineLatestAll(),
      map(() => void this.konvaItems.background.layer.batchDraw()),
      this.withDestroy(),
    );
  }

  private buildSingleViewport(freezeMode: EFreezeMode) {
    const viewport = this.viewportManager[freezeMode];
    const group = this.konvaItems.background.groups[freezeMode];

    const group$ = viewport.change$.pipe(
      filter((v) => v.type === 'box'),
      map((v) => v.current),
      startWith(viewport.box),
      map(
        (box) =>
          void group.setAttrs({
            ...box,
            clipX: 0,
            clipY: 0,
            clipWidth: box.width,
            clipHeight: box.height,
          }),
      ),
      finalize(
        () =>
          void group.setAttrs({
            x: 0,
            y: 0,
            width: 0,
            height: 0,
            clipX: undefined,
            clipY: undefined,
            clipWidth: undefined,
            clipHeight: undefined,
          }),
      ),
    );

    const subscriptions = new CollectionSubscription();
    const range$ = viewport.change$.pipe(
      filter((v) => v.type === 'range'),
      map((v) => v.current),
      startWith(viewport.range),
      map((range: ICellRange) => this.renderRegion(range, freezeMode)),
      map((mapper) => void subscriptions.update(mapper)),
      finalize(() => subscriptions.dispose()),
    );

    return combineLatest([group$, range$]);
  }

  protected abstract renderRegion(range: ICellRange, freezeMode: EFreezeMode): Map<string, () => Observable<any>>;
}

const viewportModes: EFreezeMode[] = [EFreezeMode.NONE, EFreezeMode.ROW, EFreezeMode.COLUMN, EFreezeMode.BOTH];
