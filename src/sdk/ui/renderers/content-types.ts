import type { IDisposable, TIdentifier } from '../../../container';
import type { EFreezeMode } from '../../reference';
import type { IRectBox } from '../types';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

/**
 * Context for rendering a specific cell's content
 */
export interface IContentContext {
  /**
   * Row index of the cell
   */
  rowIndex: number;
  /**
   * Column index of the cell
   */
  columnIndex: number;
  /**
   * Freeze mode of the area where the cell is being rendered
   */
  freezeMode: EFreezeMode;
}

/**
 * Result of a content editing operation
 */
export const EEditStatus = {
  /**
   * No active editing
   */
  Normal: 'normal',
  /**
   * Currently being edited
   */
  Editing: 'editing',
  /**
   * Edit successfully saved
   */
  Saved: 'saved',
  /**
   * Edit cancelled
   */
  Canceled: 'canceled',
} as const;
/**
 * Type representing the possible edit statuses
 */
export type EEditStatus = (typeof EEditStatus)[keyof typeof EEditStatus];

/**
 * Interface for managing and rendering different types of cell content
 */
export interface IContentManager extends IDisposable {
  /**
   * Renders the specified content within the given context
   *
   * @param content - The cell content to render
   * @param context - The context providing cell position and area information
   */
  render(content: unknown, context: IContentContext): Observable<any>;

  /**
   * Initiates an edit mode for the cell content
   *
   * @param content - The current cell content
   * @param context - The context providing cell position and area information
   */
  edit(content: unknown, context: IContentContext): Observable<EEditStatus>;
}
/**
 * Identifier for IContentManager in the DI container
 */
export const IContentManager: TIdentifier<IContentManager> = Symbol('IContentManager');

/**
 * Detailed context provided during the rendering process
 */
export interface IRenderingContext extends IContentContext {
  /**
   * Observable that emits the current bounding box of the cell
   */
  box$: Observable<IRectBox>;
  /**
   * Observable that emits the Konva group to which the content should be added
   */
  group$: Observable<Konva.Group>;
}
