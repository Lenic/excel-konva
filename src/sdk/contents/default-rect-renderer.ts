import type { IShapePool } from '../pools';
import type { IShapeStyleConfig } from '../renderers';
import type { IContentContext, IContentRenderer } from './types';
import type Konva from 'konva';

import { combineLatest, combineLatestWith, filter, map, Observable, startWith, switchMap } from 'rxjs';

import { ObservableDisposable } from '../utils';

export class DefaultRectContentRenderer extends ObservableDisposable implements IContentRenderer {
  private shapeStyle: IShapeStyleConfig;
  private rectPool: IShapePool<Konva.RectConfig, Konva.Rect>;

  constructor(shapeStyle: IShapeStyleConfig, rectPool: IShapePool<Konva.RectConfig, Konva.Rect>) {
    super();

    this.shapeStyle = shapeStyle;
    this.rectPool = rectPool;
  }

  render(context: IContentContext): Observable<any> {
    const { rowIndex, columnIndex, freezeMode, viewport, group } = context;
    const { x, y, width, height } = context.cellBox;

    const offset$ = viewport.change$.pipe(
      filter((v) => v.type === 'offset'),
      map((v) => v.current),
      startWith(viewport.offset),
      this.withPublish(),
    );

    return combineLatest([this.rectPool.get$, this.shapeStyle.getRectAttrs$(freezeMode, rowIndex, columnIndex)]).pipe(
      switchMap(([getter, attrs]) =>
        new Observable<Konva.Rect>((observer) => {
          const rect = getter({ ...attrs, width, height });
          if (rect.parent !== group) {
            rect.moveTo(group);
          }
          observer.next(rect);

          return () => {
            this.rectPool.reuse(rect);
          };
        }).pipe(
          combineLatestWith(offset$),
          map(([rect, offset]) =>
            rect.setAttrs({ x: x - offset.deltaX - group.x(), y: y - offset.deltaY - group.y() }),
          ),
        ),
      ),
    );
  }
}
