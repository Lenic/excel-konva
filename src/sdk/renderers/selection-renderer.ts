import type { ICellRange, IRenderGroup, ISheetConfig } from '../core';
import type { ISelectionRegion, ISelectionStore } from '../events';
import type { IShapePool } from '../pools';
import type { ICellBoxManager, IViewport, IViewportManager } from '../ui';
import type { TInterval } from '../utils';
import type Konva from 'konva';

import { combineLatest, filter, map, merge, Observable, startWith, switchMap } from 'rxjs';

import { EFreezeMode } from '../core';
import { isEqualRange, mergeIntervals } from '../utils';

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

  protected buildSingleViewport(viewport: IViewport, group: Konva.Group, freezeMode: EFreezeMode): Observable<any> {
    const selection$ = this.buildSelection(viewport, group);
    const headerHighlight$ = this.buildHeaderHighlight(viewport, group, freezeMode);

    return merge(selection$, headerHighlight$);
  }

  private buildSelection(viewport: IViewport, group: Konva.Group) {
    const selectionInitializer$ = combineLatest([
      this.selectionRectPool.get$,
      this.config.get$('selectionRectAttrs'),
    ]).pipe(
      switchMap(
        ([getter, attrs]) =>
          new Observable<Konva.Rect>((observer) => {
            const rect = getter(attrs);
            if (rect.parent !== group) {
              rect.moveTo(group);
            }
            observer.next(rect);

            return () => this.selectionRectPool.reuse(rect);
          }),
      ),
    );

    return this.store.change$.pipe(
      map(() => this.store.value),
      startWith(this.store.value),
      this.transferSourceItems(
        (v) => v.id,
        (x, y) => isEqualRange(x.range, y.range),
        (selection, rect) => this.renderRangeRect(selection.range, viewport, rect),
        () => selectionInitializer$,
      ),
    );
  }

  private buildHeaderHighlight(viewport: IViewport, group: Konva.Group, freezeMode: EFreezeMode) {
    const highlightInitializer$ = combineLatest([
      this.selectionRectPool.get$,
      this.config.get$('selectionRectAttrs'),
    ]).pipe(
      switchMap(
        ([getter, attrs]) =>
          new Observable<Konva.Rect>((observer) => {
            const rect = getter({ ...attrs, strokeWidth: 0 });
            if (rect.parent !== group) {
              rect.moveTo(group);
            }
            observer.next(rect);

            return () => this.selectionRectPool.reuse(rect);
          }),
      ),
    );

    return this.store.change$.pipe(
      map(() => this.store.value),
      startWith(this.store.value),
      map((regions) => this.buildHighlightItems(regions, freezeMode)),
      this.transferSourceItems(
        (item) => item.id,
        (x, y) => isEqualRange(x.range, y.range),
        (item, rect) => this.renderRangeRect(item.range, viewport, rect),
        () => highlightInitializer$,
      ),
    );
  }

  private buildHighlightItems(regions: ISelectionRegion[], freezeMode: EFreezeMode): IHeaderHighlightItem[] {
    let items: IHeaderHighlightItem[] = [];

    const hasRowHeader = freezeMode === EFreezeMode.COLUMN || freezeMode === EFreezeMode.BOTH;
    const hasColumnHeader = freezeMode === EFreezeMode.ROW || freezeMode === EFreezeMode.BOTH;

    if (hasRowHeader) {
      const rowIntervals = regions.map((r) => [r.range.rowStartIndex, r.range.rowEndIndex] as TInterval);
      items = mergeIntervals(rowIntervals).reduce((acc, [start, end]) => {
        acc.push({
          id: `row-highlight:${start}-${end}`,
          range: { rowStartIndex: start, rowEndIndex: end, columnStartIndex: 0, columnEndIndex: 0 },
        });
        return acc;
      }, items);
    }

    if (hasColumnHeader) {
      const colIntervals = regions.map((r) => [r.range.columnStartIndex, r.range.columnEndIndex] as TInterval);
      items = mergeIntervals(colIntervals).reduce((acc, [start, end]) => {
        acc.push({
          id: `column-highlight:${start}-${end}`,
          range: { rowStartIndex: 0, rowEndIndex: 0, columnStartIndex: start, columnEndIndex: end },
        });
        return acc;
      }, items);
    }

    return items;
  }

  private renderRangeRect(range: ICellRange, viewport: IViewport, rect: Konva.Rect): Observable<any> {
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
        return rect.setAttrs(attrs);
      }),
    );
  }
}

interface IHeaderHighlightItem {
  id: string;
  range: ICellRange;
}
