import type { IRegionInfo } from '../../types';

export interface IRectArea {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const EQuadrantType = { CORNER: 'corner', TOP: 'top', LEFT: 'left', MAIN: 'main' } as const;
export type EQuadrantType = (typeof EQuadrantType)[keyof typeof EQuadrantType];

export const ELineType = { EMPTY: 0, TOP: 1, LEFT: 2, RIGHT: 4, BOTTOM: 8, ALL: 15 } as const;
export type ELineType = (typeof ELineType)[keyof typeof ELineType];
export type TLineTypeMask = number;

export type TSelectionInfo<T extends IRectArea | IRegionInfo> = [selection: T, activeCell?: T];

export const ERenderType = { RECT: 'rect', CELL: 'cell' } as const;
export type ERenderType = (typeof ERenderType)[keyof typeof ERenderType];

export type TRectRenderInfo<T extends IRectArea | IRegionInfo> = [
  rect: T,
  lineType: TLineTypeMask,
  renderType: ERenderType,
];

export interface IRectLimitInfo {
  limitArea: Record<EQuadrantType, IRectArea>;
  limitRegion: Record<EQuadrantType, IRegionInfo>;
  frozenColumns: number;
  frozenRows: number;
}
