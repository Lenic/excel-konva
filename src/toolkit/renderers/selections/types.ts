import type { IRegionInfo } from '../../types';

/**
 * Represents a rectangular area defined by its boundaries.
 */
export interface IRectArea {
  /**
   * The top coordinate (Y-axis) of the area.
   */
  top: number;
  /**
   * The right coordinate (X-axis) of the area.
   */
  right: number;
  /**
   * The bottom coordinate (Y-axis) of the area.
   */
  bottom: number;
  /**
   * The left coordinate (X-axis) of the area.
   */
  left: number;
}

/**
 * Defines the quadrants for rendering, usually corresponding to frozen regions.
 */
export const EQuadrantType = {
  /**
   * The corner quadrant (intersection of frozen rows and columns).
   */
  CORNER: 'corner',
  /**
   * The top frozen quadrant.
   */
  TOP: 'top',
  /**
   * The left frozen quadrant.
   */
  LEFT: 'left',
  /**
   * The main scrollable quadrant.
   */
  MAIN: 'main',
} as const;
/**
 * Type alias for EQuadrantType.
 */
export type EQuadrantType = (typeof EQuadrantType)[keyof typeof EQuadrantType];

/**
 * Bitmask enum for selection border lines.
 */
export const ELineType = {
  /**
   * No lines.
   */
  EMPTY: 0,
  /**
   * Top border line.
   */
  TOP: 1,
  /**
   * Left border line.
   */
  LEFT: 2,
  /**
   * Right border line.
   */
  RIGHT: 4,
  /**
   * Bottom border line.
   */
  BOTTOM: 8,
  /**
   * All border lines.
   */
  ALL: 15,
} as const;
/**
 * Type alias for ELineType.
 */
export type ELineType = (typeof ELineType)[keyof typeof ELineType];

/**
 * A bitmask representing a combination of border lines.
 */
export type TLineTypeMask = number;

/**
 * Information about a selection, containing the selection area and an optional active cell.
 */
export type TSelectionInfo<T extends IRectArea | IRegionInfo> = [selection: T, activeCell?: T];

/**
 * Defines the rendering mode for a selection area.
 */
export const ERenderType = {
  /**
   * Render as a whole selection rectangle.
   */
  RECT: 'rect',
  /**
   * Render as an individual cell (active cell).
   */
  CELL: 'cell',
} as const;
/**
 * Type alias for ERenderType.
 */
export type ERenderType = (typeof ERenderType)[keyof typeof ERenderType];

/**
 * Rendering information for a rectangular area, including boundaries, line types, and render mode.
 */
export type TRectRenderInfo = [rect: IRectArea, lineType: TLineTypeMask, renderType: ERenderType];

/**
 * Information regarding the limits and frozen states for rectangular areas across quadrants.
 */
export interface IRectLimitInfo {
  /**
   * The physical area limits for each quadrant.
   */
  limitArea: Record<EQuadrantType, IRectArea>;
  /**
   * The logical region (index-based) limits for each quadrant.
   */
  limitRegion: Record<EQuadrantType, IRegionInfo>;
  /**
   * Number of frozen columns.
   */
  frozenColumns: number;
  /**
   * Number of frozen rows.
   */
  frozenRows: number;
}
