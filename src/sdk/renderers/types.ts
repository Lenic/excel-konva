import type { IDisposable, TIdentifier } from '../../container';
import type { EFreezeMode, IListener } from '../core';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

/**
 * Identifier for ICellRenderer in the DI container
 */
export const ICellRenderer: TIdentifier<IListener> = Symbol('ICellRenderer');

/**
 * Identifier for ISelectionRenderer in the DI container
 */
export const ISelectionRenderer: TIdentifier<IListener> = Symbol('ISelectionRenderer');

/**
 * Shape style configuration interface
 */
export interface IShapeStyleConfig extends IDisposable {
  /**
   * Observable that emits rect attributes based on freeze mode and cell position
   *
   * @param mode - The freeze mode (NONE, ROW, COLUMN, or BOTH)
   * @param rowIndex - The row index of the cell
   * @param columnIndex - The column index of the cell
   * @returns An Observable of the rectangle's configuration
   */
  getRectAttrs$(mode: EFreezeMode, rowIndex: number, columnIndex: number): Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits text attributes based on freeze mode and cell position
   *
   * @param mode - The freeze mode (NONE, ROW, COLUMN, or BOTH)
   * @param rowIndex - The row index of the cell
   * @param columnIndex - The column index of the cell
   * @returns An Observable of the text's configuration
   */
  getTextAttrs$(mode: EFreezeMode, rowIndex: number, columnIndex: number): Observable<Partial<Konva.TextConfig>>;
}
/**
 * Identifier for IShapeStyleConfig in the DI container
 */
export const IShapeStyleConfig: TIdentifier<IShapeStyleConfig> = Symbol('IShapeStyleConfig');
