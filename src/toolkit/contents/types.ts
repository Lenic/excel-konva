import type { IDisposable, TIdentifier } from '../../container';
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
 * Content context
 */
export interface IContentContext {
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
 * Edit status
 */
export const EEditStatus = {
  /**
   * Normal status
   */
  Normal: 'normal',
  /**
   * Editing status
   */
  Editing: 'editing',
  /**
   * Saved status
   */
  Saved: 'saved',
  /**
   * Canceled status
   */
  Canceled: 'canceled',
} as const;
export type EEditStatus = (typeof EEditStatus)[keyof typeof EEditStatus];

/**
 * Content manager
 */
export interface IContentManager extends IDisposable {
  /**
   * Render content
   *
   * @param content - Cell content
   * @param context - Content context
   */
  render(content: unknown, context: IContentContext): Observable<void>;
  /**
   * Edit content
   *
   * @param content - Cell content
   * @param context - Content context
   */
  edit(content: unknown, context: IContentContext): Observable<EEditStatus>;
}
/**
 * Content manager identifier
 */
export const IContentManager: TIdentifier<IContentManager> = Symbol('IContentManager');
