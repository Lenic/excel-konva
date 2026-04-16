import type { IRenderGroup } from '../core';
import type { IViewport, IViewportManager } from '../ui';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

import {
  distinctUntilChanged,
  endWith,
  exhaustMap,
  filter,
  finalize,
  from,
  groupBy,
  ignoreElements,
  map,
  mergeMap,
  shareReplay,
  startWith,
  switchMap,
  take,
  takeUntil,
  tap,
} from 'rxjs';

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
  protected renderGroup: IRenderGroup;

  /**
   * Initializes the base renderer with required managers.
   *
   * @param viewportManager - The manager for sheet viewports.
   * @param renderGroup - The items for Konva stage and groups.
   */
  constructor(viewportManager: IViewportManager, renderGroup: IRenderGroup) {
    super();

    this.viewportManager = viewportManager;
    this.renderGroup = renderGroup;
  }

  /**
   * Activates the renderer by building all viewports and subscribing to their changes.
   *
   * @returns An observable that emits when all viewports have been built and subscribed to.
   */
  protected activate() {
    return from(VIEWPORT_MODES).pipe(
      mergeMap((freezeMode) => {
        const viewport = this.viewportManager[freezeMode];
        const group = this.renderGroup.groups[freezeMode];

        return viewport.change$.pipe(
          filter((v) => v.type === 'box'),
          map((v) => v.current),
          startWith(viewport.box),
          map((box) =>
            group.setAttrs({
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
          exhaustMap((group) => this.buildSingleViewport(viewport, group, freezeMode)),
        );
      }),
      tap(() => void this.renderGroup.layer.batchDraw()),
      this.withDestroy(),
    );
  }

  /**
   * Builds a single viewport for a specific freeze mode.
   *
   * @param viewport - The viewport for the freeze mode.
   * @param group - The group for the viewport.
   * @param freezeMode - The freeze mode for which to build the viewport.
   * @returns An observable that emits the viewport.
   */
  protected abstract buildSingleViewport(
    viewport: IViewport,
    group: Konva.Group,
    freezeMode: EFreezeMode,
  ): Observable<any>;

  /**
   * Transfers items from a source observable to a converter observable based on a key selector.
   *
   * @param keySelector - A function that returns a unique key for each item.
   * @param converter - A function that converts an item to an observable.
   * @returns An observable that emits the converted items.
   */
  protected transferSourceItems<TSource, TResult>(
    keySelector: (item: TSource) => unknown,
    elementComparer: (a: TSource, b: TSource) => boolean,
    converter: (item: TSource) => Observable<TResult>,
  ) {
    return function transferItems(observable$: Observable<TSource[]>): Observable<TResult> {
      const source$ = observable$.pipe(shareReplay({ bufferSize: 1, refCount: true }));

      return source$.pipe(
        mergeMap((range) => from(range)),
        groupBy(keySelector, {
          duration: (group$) =>
            source$.pipe(
              filter((latestArray) => !latestArray.some((x) => keySelector(x) === group$.key)),
              take(1),
            ),
        }),
        mergeMap((group$) =>
          group$.pipe(
            distinctUntilChanged(elementComparer),
            switchMap(converter),
            takeUntil(group$.pipe(ignoreElements(), endWith(1))),
          ),
        ),
      );
    };
  }
}

const VIEWPORT_MODES: EFreezeMode[] = [EFreezeMode.NONE, EFreezeMode.ROW, EFreezeMode.COLUMN, EFreezeMode.BOTH];
