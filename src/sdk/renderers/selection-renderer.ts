import type { IRenderGroup, ISheetConfig } from '../core';
import type { ISelectionRegion, ISelectionStore } from '../events';
import type { IShapePool } from '../pools';
import type { ICellBoxManager, IViewport, IViewportManager } from '../ui';
import type Konva from 'konva';

import { combineLatest, filter, map, Observable, startWith, switchMap } from 'rxjs';

import { isEqualRange } from '../utils';

import { BaseRenderer } from './base-renderer';

export class SelectionRenderer extends BaseRenderer {
  private store: ISelectionStore;
  private selectionRectPool: IShapePool<Konva.RectConfig, Konva.Rect>;
  private cellBoxManager: ICellBoxManager;
  private config: ISheetConfig;

  constructor(
    store: ISelectionStore,
    viewportManager: IViewportManager,
    renderGroup: IRenderGroup,
    selectionRectPool: IShapePool<Konva.RectConfig, Konva.Rect>,
    cellBoxManager: ICellBoxManager,
    config: ISheetConfig,
  ) {
    super(viewportManager, renderGroup);

    this.store = store;
    this.selectionRectPool = selectionRectPool;
    this.cellBoxManager = cellBoxManager;
    this.config = config;
  }

  protected buildSingleViewport(viewport: IViewport, group: Konva.Group): Observable<any> {
    const initializer$ = combineLatest([this.selectionRectPool.get$, this.config.get$('selectionRectAttrs')]).pipe(
      switchMap(
        ([getter, attrs]) =>
          new Observable<Konva.Rect>((observer) => {
            const rect = getter(attrs);
            if (rect.parent !== group) {
              rect.moveTo(group);
            }
            observer.next(rect);

            return () => {
              console.log('destrory rect');
              this.selectionRectPool.reuse(rect);
            };
          }),
      ),
    );

    return this.store.change$.pipe(
      map(() => this.store.value),
      startWith(this.store.value),
      this.transferSourceItems(
        (v) => v.id,
        (x, y) => isEqualRange(x.range, y.range),
        (selection, rect) => this.renderRegion(selection, viewport, rect),
        () => initializer$,
      ),
    );
  }

  private renderRegion(selection: ISelectionRegion, viewport: IViewport, rect: Konva.Rect): Observable<any> {
    const { range } = selection;

    const offset$ = viewport.change$.pipe(
      filter((v) => v.type === 'offset'),
      map((v) => v.current),
      startWith(viewport.offset),
    );

    const viewportBox$ = viewport.change$.pipe(
      filter((v) => v.type === 'box'),
      map((v) => v.current),
      startWith(viewport.box),
    );

    return combineLatest([this.cellBoxManager.getAbsoluteBox$(range), offset$, viewportBox$]).pipe(
      map(([rangeBox, offset, viewportBox]) => {
        const attrs = {
          x: rangeBox.x - offset.deltaX - viewportBox.x,
          y: rangeBox.y - offset.deltaY - viewportBox.y,
          width: rangeBox.width,
          height: rangeBox.height,
        };
        // console.log('attrs', attrs, rect);
        return rect.setAttrs(attrs);
      }),
    );
  }
}
