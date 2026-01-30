import type { IEditContext, IRectRenderingContext, ITextRenderingContext } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, EMPTY, finalize, fromEvent, map, merge, of, skip, startWith, switchMap, take } from 'rxjs';

import { EFreezeMode } from '../types';

import { AbstractContentManager } from './core';
import { EEditStatus } from './types';

/**
 * Text content renderer
 */
export class TextContentRenderer extends AbstractContentManager {
  protected renderRect(context: IRectRenderingContext): Observable<any> {
    return combineLatest([context.group$, context.box$, context.rectAttrs$, this.getRects(1)]).pipe(
      map(([group, box, rectAttrs, [rect]]) => {
        rect.setAttrs({
          ...rectAttrs,
          ...box,
        });
        if (rect.parent !== group) rect.moveTo(group);
      }),
    );
  }

  protected renderText(context: ITextRenderingContext): Observable<any> {
    return combineLatest([context.group$, context.box$, context.textAttrs$, this.getTexts(1)]).pipe(
      map(([group, box, textAttrs, [text]]) => {
        text.setAttrs({
          ...textAttrs,
          ...box,
          text: context.content?.toString() ?? '',
        });
        if (text.parent !== group) text.moveTo(group);
      }),
    );
  }

  protected editContent(context: IEditContext): Observable<EEditStatus> {
    const { rowIndex, columnIndex } = context;
    const { x, y, width, height } = context.box;

    const editor = document.createElement('textarea');
    editor.id = `cell-text-editor-${Date.now()}`;
    editor.classList.add('cell-text-editor');
    this.excelEntrance.rootElement.appendChild(editor);

    editor.value = context.content?.toString() ?? '';

    editor.style.left = `${x - 1}px`;
    editor.style.top = `${y - 1}px`;
    editor.style.width = `${width + 2}px`;
    editor.style.height = `${height + 2}px`;
    editor.style.lineHeight = `${height - 2}px`;

    editor.focus();
    editor.select();

    return merge(
      context.freezeMode !== EFreezeMode.NONE
        ? EMPTY
        : this.offset.offset$.pipe(
            skip(1),
            map(() => false),
          ),
      context.freezeMode !== EFreezeMode.COLUMN
        ? EMPTY
        : this.offset.top$.pipe(
            skip(1),
            map(() => false),
          ),
      context.freezeMode !== EFreezeMode.ROW
        ? EMPTY
        : this.offset.left$.pipe(
            skip(1),
            map(() => false),
          ),
      fromEvent<KeyboardEvent>(editor, 'keydown').pipe(
        switchMap((e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            return of(true);
          } else if (e.key === 'Escape') {
            return of(false);
          }
          return EMPTY;
        }),
      ),
      fromEvent(editor, 'blur').pipe(map(() => true)),
    ).pipe(
      take(1),
      finalize(() => {
        editor.remove();
      }),
      map((save) => {
        if (save) {
          const newText = editor.value;
          this.cellDimension.setCellData(rowIndex, columnIndex, newText || null);
        }

        return save ? EEditStatus.Saved : EEditStatus.Canceled;
      }),
      startWith(EEditStatus.Editing),
    );
  }
}
