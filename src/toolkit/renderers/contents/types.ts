import type { IDisposable, TIdentifier } from '../../../container';
import type { Observable } from 'rxjs';

/**
 * Cell frozen type
 */
export const ECellFrozenType = {
  /**
   * Header frozen type
   */
  Header: 'header',
  /**
   * Side frozen type
   */
  Side: 'side',
  /**
   * Corner frozen type
   */
  Corner: 'corner',
  /**
   * None frozen type: normal scrollable data area
   */
  None: 'none',
} as const;

/**
 * Cell frozen type
 */
export type ECellFrozenType = (typeof ECellFrozenType)[keyof typeof ECellFrozenType];

/**
 * Content renderer context
 */
export interface IContentRendererContext {
  /**
   * Row index
   */
  rowIndex: number;
  /**
   * Column index
   */
  columnIndex: number;
  /**
   * Cell frozen type
   */
  frozenType: ECellFrozenType;
}

/**
 * Content renderer
 */
export interface IContentRenderer extends IDisposable {
  /**
   * Render content
   *
   * @param content - Cell content
   * @param context - Content renderer context
   */
  render(content: unknown, context: IContentRendererContext): Observable<void>;
}
/**
 * Content renderer identifier
 */
export const IContentRenderer: TIdentifier<IContentRenderer> = Symbol('IContentRenderer');
