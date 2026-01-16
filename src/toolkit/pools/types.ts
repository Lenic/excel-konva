import type { TIdentifier } from '../../container';
import type Konva from 'konva';

/**
 * Rectangle pool interface
 */
export interface IRectPool {
  /**
   * Get rectangle
   */
  getRect(): Konva.Rect;
  /**
   * Reset rectangle pool
   */
  reset(): void;
}
/**
 * Selection pool interface identifier
 */
export const ISelectionPool: TIdentifier<IRectPool> = Symbol('ISelectionPool');
/**
 * Active cell marker pool interface identifier
 */
export const IActiveCellMarkerPool: TIdentifier<IRectPool> = Symbol('IActiveCellMarkerPool');

/**
 * Cell pool interface
 */
export interface ICellPool extends IRectPool {
  /**
   * Get cell text
   */
  getText(): Konva.Text;
}
/**
 * Cell pool interface identifier
 */
export const ICellPool: TIdentifier<ICellPool> = Symbol('ICellPool');
