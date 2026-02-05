import type { IDisposable, TIdentifier } from '../../container';
import type Konva from 'konva';

/**
 * Freeze mode
 */
export const EFreezeMode = {
  /**
   * No freeze
   */
  NONE: 0,
  /**
   * Freeze rows
   */
  ROW: 1,
  /**
   * Freeze columns
   */
  COLUMN: 2,
  /**
   * Freeze both rows and columns
   */
  BOTH: 3,
} as const;

/**
 * Freeze mode type
 */
export type EFreezeMode = (typeof EFreezeMode)[keyof typeof EFreezeMode];

/**
 * Render group
 */
export interface IRenderGroup {
  /**
   * Konva layer
   */
  layer: Konva.Layer;
  /**
   * Konva groups for each freeze mode
   */
  groups: Record<EFreezeMode, Konva.Group>;
}

/**
 * Konva items
 */
export interface IKonvaItems extends IDisposable {
  /**
   * Konva stage
   */
  stage: Konva.Stage;
  /**
   * Background groups
   */
  background: IRenderGroup;
  /**
   * Selection groups
   */
  selection: IRenderGroup;
  /**
   * Resize line
   */
  resizeLine: Konva.Line;
}
/**
 * Konva items identifier
 */
export const IKonvaItems: TIdentifier<IKonvaItems> = Symbol('IKonvaItems');
