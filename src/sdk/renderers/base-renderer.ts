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

  protected abstract buildSingleViewport(freezeMode: EFreezeMode): Observable<any>;
}

const viewportModes: EFreezeMode[] = [EFreezeMode.NONE, EFreezeMode.ROW, EFreezeMode.COLUMN, EFreezeMode.BOTH];
