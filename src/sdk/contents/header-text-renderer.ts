import type { IShapePool } from '../pools';
import type { IShapeStyleConfig } from '../renderers';
import type { IContentContext, IContentRenderer } from './types';
import type Konva from 'konva';

import { combineLatest, combineLatestWith, EMPTY, filter, map, Observable, startWith, switchMap } from 'rxjs';

import { getColumnLabel, ObservableDisposable } from '../utils';

export class HeaderTextContentRenderer extends ObservableDisposable implements IContentRenderer {
  private shapeStyle: IShapeStyleConfig;
  private textPool: IShapePool<Konva.TextConfig, Konva.Text>;

  constructor(shapeStyle: IShapeStyleConfig, textPool: IShapePool<Konva.TextConfig, Konva.Text>) {
    super();

    this.shapeStyle = shapeStyle;
    this.textPool = textPool;
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

    let content: string;
    if (rowIndex === 0) {
      content = columnIndex === 0 ? '' : getColumnLabel(columnIndex - 1);
    } else if (columnIndex === 0) {
      content = rowIndex.toString();
    } else {
      return EMPTY;
    }

    return combineLatest([this.textPool.get$, this.shapeStyle.getTextAttrs$(freezeMode, rowIndex, columnIndex)]).pipe(
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
          combineLatestWith(offset$),
          map(([text, offset]) =>
            text.setAttrs({
              x: x - offset.deltaX - group.x(),
              y: y - offset.deltaY - group.y(),
              text: content,
            }),
          ),
        ),
      ),
    );
  }
}
