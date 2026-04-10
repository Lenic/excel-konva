import type { ICellRange, IKonvaItems } from '../core';
import type { EFreezeMode } from '../core';
import type { IDataManager } from '../data';
import type { ISelectionStore } from '../events';
import type { IViewportManager } from '../ui';
import type { Observable } from 'rxjs';

import { combineLatest, EMPTY, filter, map, of, scan, startWith, switchMap, tap } from 'rxjs';

import { DEFAULT_TEXT, HEADER_TEXT } from '../contents';
import { intersectRanges, isCellInRange } from '../utils';

import { BaseRenderer } from './base-renderer';

export class SelectionRenderer extends BaseRenderer {
  private store: ISelectionStore;
  private dataManager: IDataManager;

  constructor(
    store: ISelectionStore,
    viewportManager: IViewportManager,
    konvaItems: IKonvaItems,
    dataManager: IDataManager,
  ) {
    super(viewportManager, konvaItems);

    this.store = store;
    this.dataManager = dataManager;
  }

  protected renderRegion(range: ICellRange, freezeMode: EFreezeMode): Map<string, () => Observable<any>> {
    const viewport = this.viewportManager[freezeMode];
    const group = this.konvaItems.background.groups[freezeMode];

    viewport.change$.pipe(
      filter((v) => v.type === 'range'),
      map((v) => v.current),
      map((v) => intersectRanges(v, range)),
      switchMap((intersectRange) => {
        if (intersectRange === null) return EMPTY;

        const store$ = this.store.change$.pipe(
          scan((acc, patch) => {
            if (patch.type === 'reset') return patch.value;
            if (patch.type === 'row' && patch.index <= intersectRange.rowEndIndex) return patch.value;
            if (patch.type === 'column' && patch.index <= intersectRange.columnEndIndex) return patch.value;

            return acc;
          }, this.store.value),
        );

        const offset$ = viewport.change$.pipe(
          filter((v) => v.type === 'offset'),
          map((v) => v.current),
        );
      }),
    );

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
              return this.store.change$.pipe(
                filter((patch) => {
                  if (patch.type === 'reset') return true;
                  if (patch.type === 'row' && patch.index <= rowIndex) return true;
                  if (patch.type === 'column' && patch.index <= columnIndex) return true;

                  return false;
                }),
                map(() => this.store.getCellBox(rowIndex, columnIndex)),
                startWith(this.store.getCellBox(rowIndex, columnIndex)),
                switchMap((store) => {
                  const renderObservables = contentTypes.map(
                    (contentType) => this.renderers.get(contentType)?.render({ ...partialContext, store }) ?? of(null),
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
  }
}
