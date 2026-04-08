import type { ICellRange, IKonvaItems } from '../core';
import type { IViewportManager } from '../ui';
import type { Observable } from 'rxjs';

import { combineLatest, combineLatestAll, filter, finalize, from, map, startWith } from 'rxjs';

import { BaseListener, EFreezeMode } from '../core';

import { CollectionSubscription } from './subscription';

/**
 * Base renderer implementation
 *
 * This class is responsible for rendering visible cells in each viewport.
 * It optimizes rendering by only updating cells that enter or leave the viewport range.
 */
export abstract class BaseRenderer extends BaseListener {
  protected viewportManager: IViewportManager;
  protected konvaItems: IKonvaItems;

  /**
   * Initializes a new instance of the CellRenderer class.
   *
   * @param viewportManager - The manager providing viewport state and change events.
   * @param konvaItems - The Konva items including stage, layers, and groups.
   */
  constructor(viewportManager: IViewportManager, konvaItems: IKonvaItems) {
    super();

    this.viewportManager = viewportManager;
    this.konvaItems = konvaItems;
  }

  /**
   * Builds the main rendering observable by listening to viewport changes.
   */
  protected build() {
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

  /**
   * Renders a specific region of cells in the spreadsheet.
   *
   * @param range - The range of cells to render.
   * @param freezeMode - The freeze mode affecting the rendering.
   * @returns A map of cell IDs to observables that trigger the rendering of each cell.
   */
  protected abstract renderRegion(range: ICellRange, freezeMode: EFreezeMode): Map<string, () => Observable<any>>;
}

// Collect all viewport change observables (one for each freeze mode)
const viewportModes: EFreezeMode[] = [EFreezeMode.NONE, EFreezeMode.ROW, EFreezeMode.COLUMN, EFreezeMode.BOTH];
