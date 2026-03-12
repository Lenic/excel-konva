import type { IDisposable, TIdentifier } from '../../container';
import type { EFreezeMode } from '../core';
import type { TCellContent } from '../data';
import type { IRectBox, IViewport } from '../ui';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

/**
 * Represents the configuration and state required to render a cell's content.
 */
export interface IContentContext {
  /**
   * The row index of the cell.
   */
  rowIndex: number;
  /**
   * The column index of the cell.
   */
  columnIndex: number;
  /**
   * The freeze mode of the area where the cell is located.
   */
  freezeMode: EFreezeMode;
  /**
   * Current viewport of the content area.
   */
  viewport: IViewport;
  /**
   * The raw content data or object to be rendered.
   */
  content: TCellContent;
  /**
   * The cell box of the cell.
   */
  cellBox: IRectBox;
  /**
   * The group of the cell.
   */
  group: Konva.Group;
}

/**
 * Interface for rendering specific types of cell content.
 */
export interface IContentRenderer extends IDisposable {
  /**
   * Renders the specified content based on the provided rendering context.
   *
   * @param context The context containing cell position and area state.
   */
  render(context: IContentContext): Observable<any>;
}

/**
 * Token used to identify the IContentRenderer implementation in the dependency injection container.
 */
export const IContentRenderer: TIdentifier<IContentRenderer> = Symbol('IContentRenderer');
