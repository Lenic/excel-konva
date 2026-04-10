import type { ICellRange, IKonvaItems } from '../core';
import type { EFreezeMode } from '../core';
import type { IDataManager } from '../data';
import type { ISelectionRegion, ISelectionStore } from '../events';
import type { IShapePool } from '../pools';
import type { IViewportManager } from '../ui';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

import { combineLatest, EMPTY, filter, finalize, from, map, of, scan, startWith, switchMap, tap } from 'rxjs';

import { DEFAULT_TEXT, HEADER_TEXT } from '../contents';
import { intersectRanges, isCellInRange } from '../utils';

import { BaseRenderer } from './base-renderer';

export class SelectionRenderer extends BaseRenderer {
  private store: ISelectionStore;
  private dataManager: IDataManager;
  private regionList$: Observable<ISelectionRegion[]>;
  private activeCellPool: IShapePool<Konva.RectConfig, Konva.Rect>;
  private selectionRectPool: IShapePool<Konva.RectConfig, Konva.Rect>;

  constructor(
    store: ISelectionStore,
    viewportManager: IViewportManager,
    konvaItems: IKonvaItems,
    dataManager: IDataManager,
    activeCellPool: IShapePool<Konva.RectConfig, Konva.Rect>,
    selectionRectPool: IShapePool<Konva.RectConfig, Konva.Rect>,
  ) {
    super(viewportManager, konvaItems);

    this.store = store;
    this.dataManager = dataManager;
    this.activeCellPool = activeCellPool;
    this.selectionRectPool = selectionRectPool;

    this.regionList$ = this.store.change$.pipe(
      map(() => this.store.value),
      startWith(this.store.value),
      this.withPublish(),
    );
  }

  protected buildSingleViewport(freezeMode: EFreezeMode): Observable<any> {
    const viewport = this.viewportManager[freezeMode];
    const group = this.konvaItems.selection.groups[freezeMode];

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

    const range$ = viewport.change$.pipe(
      filter((v) => v.type === 'range'),
      map((v) => v.current),
      startWith(viewport.range),
      switchMap((range) => {
        from(this.regionList$).pipe(
          this.transferSourceItems(
            (v) => v.id,
            (region) => {
              const intersectRange = intersectRanges(region.range, range);
              if (intersectRange === null) return EMPTY;

              this.sele;
            },
          ),
        );
      }),
    );

    return combineLatest([group$, range$]);
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
