import type { ICellRange, IKonvaItems } from '../core';
import type { IViewportManager } from '../ui';
import type { Observable } from 'rxjs';

import { EMPTY, filter, map, startWith } from 'rxjs';

import { EFreezeMode } from '../core';
import { BaseListener } from '../core/base-listener';

import { CollectionSubscription } from './subscription';

/**
 * Base renderer implementation
 *
 * This class is responsible for rendering visible cells in each viewport.
 * It optimizes rendering by only updating cells that enter or leave the viewport range.
 */
export abstract class BaseRenderer extends BaseListener {
  private viewportManager: IViewportManager;
  private konvaItems: IKonvaItems;

  private subscriptions: Record<EFreezeMode, CollectionSubscription>;

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

    this.subscriptions = {
      [EFreezeMode.NONE]: new CollectionSubscription(),
      [EFreezeMode.ROW]: new CollectionSubscription(),
      [EFreezeMode.COLUMN]: new CollectionSubscription(),
      [EFreezeMode.BOTH]: new CollectionSubscription(),
    };
    this.disposeWithMe(() => {
      this.subscriptions[EFreezeMode.NONE].dispose();
      this.subscriptions[EFreezeMode.ROW].dispose();
      this.subscriptions[EFreezeMode.COLUMN].dispose();
      this.subscriptions[EFreezeMode.BOTH].dispose();
    });
  }

  /**
   * Builds the main rendering observable by listening to viewport changes.
   *
   * @returns An observable that triggers rendering updates.
   */
  protected build(): Observable<void> {
    viewportModes.forEach((freezeMode) => {
      this.buildSingleViewport(freezeMode);
    });
    return EMPTY;
  }

  private buildSingleViewport(freezeMode: EFreezeMode) {
    const viewport = this.viewportManager[freezeMode];

    const group = this.konvaItems.background.groups[freezeMode];
    this.disposeWithMe(
      viewport.change$
        .pipe(
          filter((v) => v.type === 'box'),
          map((v) => v.current),
          startWith(viewport.box),
        )
        .subscribe((box) => {
          group.setAttrs({
            ...box,
            clipX: 0,
            clipY: 0,
            clipWidth: box.width,
            clipHeight: box.height,
          });
        }),
    );

    viewport.change$
      .pipe(
        filter((v) => v.type === 'range'),
        map((v) => v.current),
        startWith(viewport.range),
        map((range: ICellRange) => this.renderRegion(range, freezeMode)),
        this.withDestroy(),
      )
      .subscribe((mapper) => {
        this.subscriptions[freezeMode].update(mapper);
      });
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
