import type { ICellRange } from '../../core';
import type { IDataManager } from '../../data';
import type { IKonvaItems } from '../../reference';
import type { IShapePool } from '../pools/types';
import type { ILayoutCache, IViewportManager } from '../types';
import type { ICellRenderer } from './types';
import type Konva from 'konva';

import { Observable, tap } from 'rxjs';
import { combineLatestWith, filter, startWith } from 'rxjs';
import { map, switchMap } from 'rxjs';

import { EFreezeMode } from '../../reference';
import { CollectionSubscription } from '../subscription';

import { RenderListener } from './renderer';

/**
 * Cell renderer implementation
 *
 * This class is responsible for rendering visible cells in each viewport.
 * It optimizes rendering by only updating cells that enter or leave the viewport range.
 */
export class CellRenderer extends RenderListener<unknown> implements ICellRenderer {
  private viewportManager: IViewportManager;
  private konvaItems: IKonvaItems;
  private rectPool: IShapePool<Konva.RectConfig, Konva.Rect>;
  private textPool: IShapePool<Konva.TextConfig, Konva.Text>;
  private layoutCache: ILayoutCache;
  private dataManager: IDataManager;

  private subscriptions: Record<EFreezeMode, CollectionSubscription>;

  /**
   * Initializes a new instance of the CellRenderer class.
   *
   * @param viewportManager - The manager providing viewport state and change events.
   * @param konvaItems - The Konva items including stage, layers, and groups.
   * @param rectPool - The pool for Konva.Rect shapes.
   * @param textPool - The pool for Konva.Text shapes.
   * @param layoutCache - The layout cache for cell dimensions.
   */
  constructor(
    viewportManager: IViewportManager,
    konvaItems: IKonvaItems,
    rectPool: IShapePool<Konva.RectConfig, Konva.Rect>,
    textPool: IShapePool<Konva.TextConfig, Konva.Text>,
    layoutCache: ILayoutCache,
    dataManager: IDataManager,
  ) {
    super();

    this.viewportManager = viewportManager;
    this.konvaItems = konvaItems;
    this.rectPool = rectPool;
    this.textPool = textPool;
    this.layoutCache = layoutCache;
    this.dataManager = dataManager;

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
  protected build(): Observable<unknown> {
    // Collect all viewport change observables (one for each freeze mode)
    const viewportModes: EFreezeMode[] = [EFreezeMode.NONE, EFreezeMode.ROW, EFreezeMode.COLUMN, EFreezeMode.BOTH];

    viewportModes.forEach((mode) => {
      this.buildSingleViewport(mode).subscribe((mapper) => {
        this.subscriptions[mode].update(mapper);
      });
    });

    console.log('build', this.viewportManager);

    const mainViewport = this.viewportManager[EFreezeMode.NONE];
    return mainViewport.change$.pipe(
      map(() => mainViewport.range),
      startWith(mainViewport.range),
    );
  }

  private buildSingleViewport(mode: EFreezeMode) {
    const viewport = this.viewportManager[mode];
    const group = this.konvaItems.background.groups[mode];

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

    const offset$ = viewport.change$.pipe(
      filter((v) => v.type === 'offset'),
      map((v) => v.current),
      startWith(viewport.offset),
      this.withPublish(),
    );

    return viewport.change$.pipe(
      filter((v) => v.type === 'range'),
      map((v) => v.current),
      startWith(viewport.range),
      map((range: ICellRange) => {
        const shape$Map = new Map<string, () => Observable<Konva.Shape>>();
        for (let rowIndex = range.rowStartIndex; rowIndex <= range.rowEndIndex; rowIndex++) {
          for (let columnIndex = range.columnStartIndex; columnIndex <= range.columnEndIndex; columnIndex++) {
            const { x, y, width, height } = this.layoutCache.getCellRect(rowIndex, columnIndex);

            const getRect$ = () =>
              this.rectPool.get$.pipe(
                switchMap((getter) =>
                  new Observable<Konva.Rect>((observer) => {
                    const rect = getter({ width, height });
                    if (rect.parent !== group) {
                      group.add(rect);
                    }
                    observer.next(rect);

                    return () => {
                      this.rectPool.reuse(rect);
                    };
                  }).pipe(
                    combineLatestWith(offset$),
                    map(([rect, offset]) =>
                      rect.setAttrs({ x: x + offset.deltaX - group.x(), y: y + offset.deltaY - group.y() }),
                    ),
                    tap(() => {
                      this.konvaItems.background.layer.batchDraw();
                    }),
                  ),
                ),
              );
            shape$Map.set(`rect:${rowIndex}:${columnIndex}`, getRect$);

            const getText$ = () =>
              this.textPool.get$.pipe(
                switchMap((getter) =>
                  new Observable<Konva.Text>((observer) => {
                    const text = getter({ width, height });
                    if (text.parent !== group) {
                      group.add(text);
                    }
                    observer.next(text);

                    return () => {
                      this.textPool.reuse(text);
                    };
                  }).pipe(
                    combineLatestWith(
                      offset$,
                      this.dataManager.patch$.pipe(
                        filter(
                          (v) =>
                            rowIndex >= v.range.rowStartIndex &&
                            rowIndex <= v.range.rowEndIndex &&
                            columnIndex >= v.range.columnStartIndex &&
                            columnIndex <= v.range.columnEndIndex,
                        ),
                        map(() => this.dataManager.get(rowIndex, columnIndex)),
                        startWith(this.dataManager.get(rowIndex, columnIndex)),
                      ),
                    ),
                    map(([text, offset, content]) =>
                      text.setAttrs({
                        x: x + offset.deltaX - group.x(),
                        y: y + offset.deltaY - group.y(),
                        text: content as string,
                      }),
                    ),
                    tap(() => {
                      this.konvaItems.background.layer.batchDraw();
                    }),
                  ),
                ),
              );
            shape$Map.set(`text:${rowIndex}:${columnIndex}`, getText$);
          }
        }
        return shape$Map;
      }),
    );
  }
}
