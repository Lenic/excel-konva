import type { TCellContent } from '../../data';
import type { ICellTextPool } from '../pools/types';
import type { ILayoutCache } from '../types';
import type { IContentContext, IContentManager } from './content-types';
import type { Observable } from 'rxjs';

import { map, of } from 'rxjs';

/**
 * Renderer for cell text content
 */
export class TextContentRenderer implements IContentManager {
  private textPool: ICellTextPool;
  private layoutCache: ILayoutCache;

  isDisposed = false;

  /**
   * Initializes a new instance of the TextContentRenderer class.
   *
   * @param textPool - Pool for reusing Konva.Text shapes
   * @param layoutCache - Cache for cell positions and sizes
   */
  constructor(textPool: ICellTextPool, layoutCache: ILayoutCache) {
    this.textPool = textPool;
    this.layoutCache = layoutCache;
  }

  /**
   * Renders the given content within the specified context
   */
  render(content: TCellContent, context: IContentContext): Observable<any> {
    const value = typeof content === 'string' ? content : content?.value;

    if (value === undefined || value === null || value === '') {
      return of({ shapes: [] });
    }

    const rect = this.layoutCache.getCellRect(context.rowIndex, context.columnIndex);
    const textStr = String(value);

    return this.textPool.get$.pipe(
      map((get) => {
        const textShape = get({
          text: textStr,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          verticalAlign: 'middle',
          align: 'center',
        });

        return {
          shapes: [textShape],
          dispose: () => {
            this.textPool.reuse(textShape);
          },
        };
      }),
    );
  }

  /**
   * Dummy implementation for edit mode
   */
  edit(_content: unknown, _context: IContentContext): Observable<any> {
    return of('normal'); // EEditStatus.Normal
  }

  /**
   * Dispose content renderer
   */
  dispose(): void {
    this.isDisposed = true;
  }

  disposeWithMe(): void {
    this.dispose();
  }
}
