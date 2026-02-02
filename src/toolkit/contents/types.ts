import type { IDisposable, TIdentifier } from '../../container';
import type { EFreezeMode, IRectBox } from '../types';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

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
   * Cell freeze mode
   */
  freezeMode: EFreezeMode;
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
  render(content: unknown, context: IContentContext): Observable<any>;
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

/**
 * Rendering context
 */
export interface IRenderingContext extends IContentContext {
  /**
   * Bounding box Observable
   */
  box$: Observable<IRectBox>;
  /**
   * Parent group Observable
   */
  group$: Observable<Konva.Group>;
}

/**
 * Rect rendering context
 */
export interface IRectRenderingContext extends IRenderingContext {
  /**
   * Rectangle attributes Observable
   */
  rectAttrs$: Observable<Partial<Konva.RectConfig>>;
}

/**
 * Text rendering context
 */
export interface ITextRenderingContext extends IRenderingContext {
  /**
   * Text content
   */
  content: unknown;
  /**
   * Text attributes Observable
   */
  textAttrs$: Observable<Partial<Konva.TextConfig>>;
}

/**
 * Edit context
 */
export interface IEditContext extends IContentContext {
  /**
   * Bounding box
   */
  box: IRectBox;
  /**
   * Cell content
   */
  content: unknown;
}
