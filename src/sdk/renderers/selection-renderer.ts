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
    const headerHighlight$ = this.buildHighlight(viewport, group, freezeMode);

    return merge(selection$, headerHighlight$);
  }

  private buildSelection(viewport: IViewport, group: Konva.Group) {
    return this.store.change$.pipe(
      map(() => this.store.value),
      startWith(this.store.value),
      map((regions) => this.buildSelectionItems(regions)),
      this.transferSourceItems<IIdentifiedRange, string, Konva.Rect, Konva.Rect>(
        (item) => item.id,
        (x, y) => isEqualRange(x.range, y.range),
        (item, rect) => this.renderRangeRect(item.range, viewport, rect),
        (key) => {
          const type = key.split('-')[0];
          const rectAttrsKey = type === 'active' ? 'activeCellRectAttrs' : 'selectionRectAttrs';

          return combineLatest([this.selectionRectPool.get$, this.config.get$(rectAttrsKey)]).pipe(
            switchMap(
              ([getter, attrs]) =>
                new Observable<Konva.Rect>((observer) => {
                  const rect = getter({
                    ...attrs,
                    strokeEnabled: type !== 'bg',
                    fillEnabled: type !== 'border',
                  });
                  if (rect.parent !== group) {
                    rect.moveTo(group);
                  }
                  observer.next(rect);

                  return () => this.selectionRectPool.reuse(rect);
                }),
            ),
          );
        },
      ),
    );
  }

  private buildHighlight(viewport: IViewport, group: Konva.Group, freezeMode: EFreezeMode) {
    return this.store.change$.pipe(
      map(() => this.store.value),
      startWith(this.store.value),
      map((regions) => this.buildHighlightItems(regions, freezeMode)),
      this.transferSourceItems(
        (item) => item.id,
        (x, y) => isEqualRange(x.range, y.range),
        (item, rect) => this.renderRangeRect(item.range, viewport, rect),
        () =>
          combineLatest([this.selectionRectPool.get$, this.config.get$('selectionRectAttrs')]).pipe(
            switchMap(
              ([getter, attrs]) =>
                new Observable<Konva.Rect>((observer) => {
                  const rect = getter({ ...attrs, strokeEnabled: false });
                  if (rect.parent !== group) {
                    rect.moveTo(group);
                  }
                  observer.next(rect);

                  return () => this.selectionRectPool.reuse(rect);
                }),
            ),
          ),
      ),
    );
  }

  private buildSelectionItems(regions: ISelectionRegion[]) {
    const items: IIdentifiedRange[] = [];

    for (const region of regions) {
      const { range, activeCell, id } = region;
      const r1 = range.rowStartIndex;
      const r2 = range.rowEndIndex;
      const c1 = range.columnStartIndex;
      const c2 = range.columnEndIndex;

      const ar = Math.max(r1, Math.min(r2, activeCell.rowIndex));
      const ac = Math.max(c1, Math.min(c2, activeCell.columnIndex));

      items.push({ id: `border-${id}`, range });

      if (ar > r1) {
        items.push({
          id: `bg-${id}-top`,
          range: { rowStartIndex: r1, rowEndIndex: ar - 1, columnStartIndex: c1, columnEndIndex: c2 },
        });
      }

      if (ar < r2) {
        items.push({
          id: `bg-${id}-bottom`,
          range: { rowStartIndex: ar + 1, rowEndIndex: r2, columnStartIndex: c1, columnEndIndex: c2 },
        });
      }

      if (ac > c1) {
        items.push({
          id: `bg-${id}-left`,
          range: { rowStartIndex: ar, rowEndIndex: ar, columnStartIndex: c1, columnEndIndex: ac - 1 },
        });
      }

      if (ac < c2) {
        items.push({
          id: `bg-${id}-right`,
          range: { rowStartIndex: ar, rowEndIndex: ar, columnStartIndex: ac + 1, columnEndIndex: c2 },
        });
      }

      items.push({
        id: `active-${id}`,
        range: { rowStartIndex: ar, rowEndIndex: ar, columnStartIndex: ac, columnEndIndex: ac },
      });
    }

    return items;
  }

  private buildHighlightItems(regions: ISelectionRegion[], freezeMode: EFreezeMode) {
    let items: IIdentifiedRange[] = [];

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

  private renderRangeRect(range: ICellRange, viewport: IViewport, rect: Konva.Rect) {
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

interface IIdentifiedRange {
  id: string;
  range: ICellRange;
}
