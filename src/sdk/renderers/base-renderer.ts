import type { IKonvaItems } from '../core';
import type { IViewportManager } from '../ui';
import type { Observable } from 'rxjs';

import { endWith, exhaustMap, groupBy, ignoreElements, mergeMap, share, take, takeUntil } from 'rxjs';
import { combineLatestAll, filter, from, map } from 'rxjs';

import { BaseListener, EFreezeMode } from '../core';

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

  /**
   * Activates the renderer by building all viewports and subscribing to their changes.
   *
   * @returns An observable that emits when all viewports have been built and subscribed to.
   */
  protected activate() {
    return from(viewportModes).pipe(
      map((freezeMode) => this.buildSingleViewport(freezeMode)),
      combineLatestAll(),
      map(() => void this.konvaItems.background.layer.batchDraw()),
      this.withDestroy(),
    );
  }

  /**
   * Builds a single viewport for a specific freeze mode.
   *
   * @param freezeMode - The freeze mode for which to build the viewport.
   * @returns An observable that emits the viewport.
   */
  protected abstract buildSingleViewport(freezeMode: EFreezeMode): Observable<any>;

  /**
   * Transfers items from a source observable to a converter observable based on a key selector.
   *
   * @param keySelector - A function that returns a unique key for each item.
   * @param converter - A function that converts an item to an observable.
   * @returns An observable that emits the converted items.
   */
  protected transferSourceItems<TSource, TResult>(
    keySelector: (item: TSource) => unknown,
    converter: (item: TSource) => Observable<TResult>,
  ) {
    return function transferItems(observable$: Observable<TSource[]>): Observable<TResult> {
      const source$ = observable$.pipe(share());

      return source$.pipe(
        mergeMap((range) => from(range)),
        groupBy(keySelector, {
          duration: (group$) =>
            source$.pipe(
              filter((latestArray) => !latestArray.some((x) => keySelector(x) === group$.key)),
              take(1),
            ),
        }),
        mergeMap((group$) => group$.pipe(exhaustMap(converter), takeUntil(group$.pipe(ignoreElements(), endWith(1))))),
      );
    };
  }
}

const viewportModes: EFreezeMode[] = [EFreezeMode.NONE, EFreezeMode.ROW, EFreezeMode.COLUMN, EFreezeMode.BOTH];
