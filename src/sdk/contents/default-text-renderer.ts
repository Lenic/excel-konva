import type { IKonvaItems, IOffset } from '../core';
import type { IDataManager } from '../data';
import type { ICursorListener } from '../events';
import type { IShapePool } from '../pools';
import type { IShapeStyleConfig } from '../renderers';
import type { IRectBox } from '../ui';
import type { IContentContext, IContentRenderer } from './types';
import type Konva from 'konva';

import { combineLatest, combineLatestWith, EMPTY, filter, map, Observable, startWith, switchMap, tap } from 'rxjs';

import { isCellInRange, ObservableDisposable } from '../utils';

export class DefaultTextContentRenderer extends ObservableDisposable implements IContentRenderer {
  private konvaItems: IKonvaItems;
  private dataManager: IDataManager;
  private shapeStyle: IShapeStyleConfig;
  private cursorListener: ICursorListener;
  private textPool: IShapePool<Konva.TextConfig, Konva.Text>;

  constructor(
    konvaItems: IKonvaItems,
    dataManager: IDataManager,
    shapeStyle: IShapeStyleConfig,
    cursorListener: ICursorListener,
    textPool: IShapePool<Konva.TextConfig, Konva.Text>,
  ) {
    super();

    this.konvaItems = konvaItems;
    this.dataManager = dataManager;
    this.shapeStyle = shapeStyle;
    this.cursorListener = cursorListener;
    this.textPool = textPool;
  }

  render(context: IContentContext): Observable<any> {
    const { rowIndex, columnIndex, freezeMode, viewport, group } = context;
    const { x, y, width, height } = context.cellBox;

    if (rowIndex === 0 || columnIndex === 0) {
      throw new Error('Invalid cell index');
    }

    const offset$ = viewport.change$.pipe(
      filter((v) => v.type === 'offset'),
      map((v) => v.current),
      startWith(viewport.offset),
      this.withPublish(),
    );

    const content$ = this.dataManager.change$.pipe(
      filter((v) => isCellInRange(rowIndex, columnIndex, v.range)),
      map(() => this.dataManager.get(rowIndex, columnIndex)),
      startWith(this.dataManager.get(rowIndex, columnIndex)),
    );

    const renderer$ = combineLatest([
      this.textPool.get$,
      this.shapeStyle.getTextAttrs$(freezeMode, rowIndex, columnIndex),
    ]).pipe(
      switchMap(([getter, attrs]) =>
        new Observable<Konva.Text>((observer) => {
          const text = getter({ ...attrs, width, height });
          if (text.parent !== group) {
            text.moveTo(group);
          }
          observer.next(text);

          return () => {
            this.textPool.reuse(text);
          };
        }).pipe(
          combineLatestWith(offset$, content$),
          map(([text, offset, content]) =>
            text.setAttrs({
              x: x - offset.deltaX - group.x(),
              y: y - offset.deltaY - group.y(),
              text: content as string,
            }),
          ),
        ),
      ),
    );

    const el$ = this.buildEditor$(context.cellBox, offset$);
    const editor$ = this.cursorListener.change$.pipe(
      filter((v) => v.type === 'location'),
      map((v) => v.current),
      startWith(this.cursorListener.location),
      switchMap((location) => (location?.rowIndex === rowIndex && location.columnIndex === columnIndex ? el$ : EMPTY)),
    );

    return combineLatest([renderer$, editor$]);
  }

  private buildEditor$({ x, y, width }: IRectBox, offset$: Observable<IOffset>) {
    return combineLatest([
      new Observable<HTMLDivElement>((observer) => {
        let el: HTMLDivElement | null = null;

        el = document.createElement('div');
        el.style.position = 'absolute';
        el.style.width = `30px`;
        el.style.height = `20px`;
        el.style.background = 'orange';

        this.konvaItems.stage.container().appendChild(el);
        observer.next(el);

        return () => {
          el?.remove();
          el = null;
        };
      }),
      offset$,
    ]).pipe(
      tap(([el, offset]) => {
        el.style.top = `${y - offset.deltaY + 5}px`;
        el.style.left = `${x - offset.deltaX + width - 36}px`;
      }),
    );
  }
}
