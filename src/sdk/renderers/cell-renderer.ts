import type { IContentRenderer } from '../contents';
import type { ICellRange, IKonvaItems } from '../core';
import type { IDataManager } from '../data';
import type { ICellBoxManager, IViewportManager } from '../ui';
import type { Observable } from 'rxjs';

import { combineLatest, EMPTY, filter, map, of, startWith, switchMap, tap } from 'rxjs';

import { DEFAULT_TEXT, HEADER_TEXT } from '../contents';
import { EFreezeMode } from '../core';
import { isCellInRange } from '../utils';

import { RenderListener } from './renderer';
import { CollectionSubscription } from './subscription';

/**
 * Cell renderer implementation
 *
 * This class is responsible for rendering visible cells in each viewport.
 * It optimizes rendering by only updating cells that enter or leave the viewport range.
 */
export class CellRenderer extends RenderListener<void> {
  private cellBox: ICellBoxManager;
  private viewportManager: IViewportManager;
  private konvaItems: IKonvaItems;
  private dataManager: IDataManager;
  private renderers: Map<string | symbol, IContentRenderer>;

  private subscriptions: Record<EFreezeMode, CollectionSubscription>;

  /**
   * Initializes a new instance of the CellRenderer class.
   *
   * @param cellBox - The manager providing cell box information.
   * @param viewportManager - The manager providing viewport state and change events.
   * @param konvaItems - The Konva items including stage, layers, and groups.
   * @param dataManager - The data manager for cell data.
   * @param renderers - The renderers for cell contents.
   */
  constructor(
    cellBox: ICellBoxManager,
    viewportManager: IViewportManager,
    konvaItems: IKonvaItems,
    dataManager: IDataManager,
    renderers: Map<string | symbol, IContentRenderer>,
  ) {
    super();

    this.cellBox = cellBox;
    this.viewportManager = viewportManager;
    this.konvaItems = konvaItems;
    this.dataManager = dataManager;
    this.renderers = renderers;

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
        map((range: ICellRange) => {
          const render$Map = new Map<string, () => Observable<any>>();
          for (let rowIndex = range.rowStartIndex; rowIndex <= range.rowEndIndex; rowIndex++) {
            for (let columnIndex = range.columnStartIndex; columnIndex <= range.columnEndIndex; columnIndex++) {
              render$Map.set(`render:${freezeMode}:${rowIndex}:${columnIndex}`, () => {
                return this.dataManager.change$.pipe(
                  filter((patch) => isCellInRange(rowIndex, columnIndex, patch.range)),
                  map(() => this.dataManager.get(rowIndex, columnIndex)),
                  startWith(this.dataManager.get(rowIndex, columnIndex)),
                  switchMap((content) => {
                    const contentTypes = ['', rowIndex === 0 || columnIndex === 0 ? HEADER_TEXT : DEFAULT_TEXT];
                    if (!(content === null || typeof content === 'string')) {
                      contentTypes.push(...content.type);
                    }

                    const partialContext = { rowIndex, columnIndex, content, freezeMode, viewport, group };
                    return this.cellBox.change$.pipe(
                      filter((patch) => {
                        if (patch.type === 'reset') return true;
                        if (patch.type === 'row' && patch.index <= rowIndex) return true;
                        if (patch.type === 'column' && patch.index <= columnIndex) return true;

                        return false;
                      }),
                      map(() => this.cellBox.getCellBox(rowIndex, columnIndex)),
                      startWith(this.cellBox.getCellBox(rowIndex, columnIndex)),
                      switchMap((cellBox) => {
                        const renderObservables = contentTypes.map(
                          (contentType) =>
                            this.renderers.get(contentType)?.render({ ...partialContext, cellBox }) ?? of(null),
                        );

                        return combineLatest(renderObservables).pipe(
                          tap(() => {
                            this.konvaItems.background.layer.batchDraw();
                          }),
                        );
                      }),
                      this.withDestroy(),
                    );
                  }),
                );
              });
            }
          }
          return render$Map;
        }),
        this.withDestroy(),
      )
      .subscribe((mapper) => {
        this.subscriptions[freezeMode].update(mapper);
      });
  }
}

// Collect all viewport change observables (one for each freeze mode)
const viewportModes: EFreezeMode[] = [EFreezeMode.NONE, EFreezeMode.ROW, EFreezeMode.COLUMN, EFreezeMode.BOTH];
