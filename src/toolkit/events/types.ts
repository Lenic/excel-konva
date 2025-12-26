import type { BoundaryTypes, MousedownTypes } from './constants';
import type Konva from 'konva';

export type TMousedownTypes = (typeof MousedownTypes)[keyof typeof MousedownTypes];

export interface IMouseEmptyEvent {
  mousedownType: typeof MousedownTypes.Empty;
  event: Konva.KonvaEventObject<MouseEvent>;
}

export type TBoundaryTypes = (typeof BoundaryTypes)[keyof typeof BoundaryTypes];

export interface IBoundaryInfo {
  index: number;
  boundary: number;
  type: TBoundaryTypes;
}

export interface IResizeBoundaryEvent {
  mousedownType: typeof MousedownTypes.ResizeBoundary;
  event: Konva.KonvaEventObject<MouseEvent>;
  data: IBoundaryInfo;
}

export type TMousedownEvent = IMouseEmptyEvent | IResizeBoundaryEvent;
