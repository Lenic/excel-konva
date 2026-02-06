import type { ICellRange } from '../../core';
import type { IDataManager, TCellContent } from '../../data';
import type { IViewportManager } from '../types';
import type { IContentContext, IContentManager } from './content-types';
import type { ICellRenderer } from './types';
import type { Observable, Subscription } from 'rxjs';

import { combineLatest, map, switchMap } from 'rxjs';

import { EFreezeMode } from '../../reference';
import { diffRanges } from '../../utils/range';

import { RenderListener } from './renderer';

/**
 * Cell renderer implementation
 *
 * This class is responsible for rendering visible cells in each viewport.
 * It optimizes rendering by only updating cells that enter or leave the viewport range.
 */
export class CellRenderer extends RenderListener<unknown> implements ICellRenderer {
  private viewportManager: IViewportManager;
  private dataManager: IDataManager;
  private contentManagers: Map<string | symbol, IContentManager>;

  // Map to track active subscriptions for each visible cell across all viewports
  // Key format: "mode:rowIndex:columnIndex"
  private cellSubscriptions: Map<string, Subscription>;

  /**
   * Initializes a new instance of the CellRenderer class.
   *
   * @param viewportManager - The manager providing viewport state and change events.
   * @param dataManager - The manager providing cell data access and change events.
   * @param contentManagers - A map of available content managers for different cell types.
   */
  constructor(
    viewportManager: IViewportManager,
    dataManager: IDataManager,
    contentManagers: Map<string | symbol, IContentManager>,
  ) {
    super();

    this.viewportManager = viewportManager;
    this.dataManager = dataManager;
    this.contentManagers = contentManagers;

    this.cellSubscriptions = new Map<string, Subscription>();
    this.disposeWithMe(() => {
      this.clearAllSubscriptions();
    });
  }

  /**
   * Builds the main rendering observable by listening to viewport changes.
   *
   * @returns An observable that triggers rendering updates.
   */
  protected build(): Observable<unknown> {
    // Collect all viewport change observables (one for each freeze mode)
    const viewportModes: EFreezeMode[] = [EFreezeMode.NONE, EFreezeMode.ROW, EFreezeMode.COLUMN, EFreezeMode.BOTH];

    const modeChanges$ = viewportModes.map((mode) => {
      const viewport = this.viewportManager[mode];
      return viewport.change$.pipe(map((patch) => ({ mode, patch })));
    });

    // We use a merge-like approach to react to any viewport's change
    return combineLatest(modeChanges$).pipe(
      map((changes) => {
        for (const { mode, patch } of changes) {
          if (patch.type === 'range') {
            this.handleRangeChange(mode, patch.previous, patch.current);
          }
        }
        return null;
      }),
    );
  }

  /**
   * Handles changes in the visible cell range of a specific viewport mode.
   *
   * @param mode - The freeze mode of the viewport.
   * @param previous - The previous visible range.
   * @param current - The current visible range.
   */
  private handleRangeChange(mode: EFreezeMode, previous: ICellRange | undefined, current: ICellRange): void {
    if (!previous) {
      // First time range initialization
      for (let r = current.rowStartIndex; r <= current.rowEndIndex; r++) {
        for (let c = current.columnStartIndex; c <= current.columnEndIndex; c++) {
          this.addCellSubscription(mode, r, c);
        }
      }
      return;
    }

    const { added, removed } = diffRanges(previous, current);

    // Remove cells that moved out of the viewport
    for (const { rowIndex, columnIndex } of removed) {
      this.removeCellSubscription(mode, rowIndex, columnIndex);
    }

    // Add cells that moved into the viewport
    for (const { rowIndex, columnIndex } of added) {
      this.addCellSubscription(mode, rowIndex, columnIndex);
    }
  }

  /**
   * Adds a data-driven subscription for a specific cell.
   *
   * @param mode - The freeze mode.
   * @param rowIndex - The row index.
   * @param columnIndex - The column index.
   */
  private addCellSubscription(mode: EFreezeMode, rowIndex: number, columnIndex: number): void {
    const key = `${mode}:${rowIndex}:${columnIndex}`;
    if (this.cellSubscriptions.has(key)) return;

    const context: IContentContext = { rowIndex, columnIndex, freezeMode: mode };

    // Create a subscription that reacts to data changes for this cell
    // We start with the current value and then react to patches targeting this cell
    const sub = this.dataManager.patch$
      .pipe(
        // Optimization: only react if the patch affects this specific cell
        // (This is simplified; a real implementation might need more sophisticated range overlap checking)
        switchMap(() => {
          const content = this.dataManager.get(rowIndex, columnIndex) ?? null;
          return this.getRenderer(content).render(content, context);
        }),
      )
      .subscribe();

    this.cellSubscriptions.set(key, sub);
  }

  /**
   * Removes the subscription for a specific cell.
   *
   * @param mode - The freeze mode.
   * @param rowIndex - The row index.
   * @param columnIndex - The column index.
   */
  private removeCellSubscription(mode: EFreezeMode, rowIndex: number, columnIndex: number): void {
    const key = `${mode}:${rowIndex}:${columnIndex}`;
    const sub = this.cellSubscriptions.get(key);
    if (sub) {
      sub.unsubscribe();
      this.cellSubscriptions.delete(key);
    }
  }

  /**
   * Clears all active cell subscriptions.
   */
  private clearAllSubscriptions(): void {
    this.cellSubscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
    this.cellSubscriptions.clear();
  }

  /**
   * Selects the appropriate content manager for the given cell content.
   *
   * @param _content - The cell content.
   * @returns The content manager to use for rendering.
   */
  private getRenderer(_content: TCellContent): IContentManager {
    // Defaulting to the base renderer; logic can be expanded based on content types
    const renderer = this.contentManagers.get('');
    if (!renderer) {
      throw new Error('No default content renderer registered.');
    }
    return renderer;
  }
}
