import type { IItemBoundary, ISheetConfig, ISheetDimension } from '../helpers';
import type { ILocation, IRegionInfo } from '../types';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

/**
 * Mouse down event types
 */
export const EMousedownTypes = {
  /**
   * Empty event
   */
  Empty: 'empty',
  /**
   * Resize boundary event
   */
  ResizeBoundary: 'resize-boundary',
  /**
   * Header click event
   */
  HeaderClick: 'header-click',
  /**
   * Cell click event
   */
  CellClick: 'cell-click',
} as const;

/**
 * Mouse down event types
 */
export type EMousedownTypes = (typeof EMousedownTypes)[keyof typeof EMousedownTypes];

/**
 * Mouse empty event interface
 */
export interface IMouseEmptyEvent {
  /**
   * Event type
   */
  mousedownType: typeof EMousedownTypes.Empty;
  /**
   * Original Konva event object
   */
  event: Konva.KonvaEventObject<MouseEvent>;
}

/**
 * Boundary types
 */
export const EBoundaryTypes = {
  /**
   * Column boundary
   */
  Column: 'column-boundary',
  /**
   * Row boundary
   */
  Row: 'row-boundary',
} as const;

/**
 * Boundary types
 */
export type EBoundaryTypes = (typeof EBoundaryTypes)[keyof typeof EBoundaryTypes];

/**
 * Boundary information interface
 */
export interface IBoundaryInfo {
  /**
   * Index of the row or column
   */
  index: number;
  /**
   * Boundary position (coordinate)
   */
  boundary: number;
  /**
   * Type of boundary
   */
  type: EBoundaryTypes;
}

/**
 * Resize boundary event interface
 */
export interface IResizeBoundaryEvent {
  /**
   * Event type
   */
  mousedownType: typeof EMousedownTypes.ResizeBoundary;
  /**
   * Original Konva event object
   */
  event: Konva.KonvaEventObject<MouseEvent>;
  /**
   * Boundary information data
   */
  data: IBoundaryInfo;
}

/**
 * Header click types
 */
export const EHeaderClickType = {
  RowHeader: 'row-header',
  ColumnHeader: 'column-header',
  Corner: 'corner',
} as const;

/**
 * Header click types
 */
export type EHeaderClickType = (typeof EHeaderClickType)[keyof typeof EHeaderClickType];

/**
 * Selection region interface
 */
export interface ISelectionRegion {
  /**
   * Selected region information
   */
  region: IRegionInfo;
  /**
   * Active cell location
   */
  activeCell: ILocation;
}

/**
 * Header click data interface
 */
export interface IHeaderClickData extends ISelectionRegion {
  /**
   * Type of header click
   */
  type: EHeaderClickType;
  /**
   * Whether multi-select mode is active (e.g. Ctrl/Cmd key pressed)
   */
  isMultiSelect: boolean;
}

/**
 * Header click event interface
 */
export interface IHeaderClickEvent {
  /**
   * Event type
   */
  mousedownType: typeof EMousedownTypes.HeaderClick;
  /**
   * Original Konva event object
   */
  event: Konva.KonvaEventObject<MouseEvent>;
  /**
   * Header click data
   */
  data: IHeaderClickData;
}

/**
 * Cell click data interface
 */
export interface ICellClickData extends ISelectionRegion {
  /**
   * Whether multi-select mode is active (e.g. Ctrl/Cmd key pressed)
   */
  isMultiSelect: boolean;
}

/**
 * Cell click event interface
 */
export interface ICellClickEvent {
  /**
   * Event type
   */
  mousedownType: typeof EMousedownTypes.CellClick;
  /**
   * Original Konva event object
   */
  event: Konva.KonvaEventObject<MouseEvent>;
  /**
   * Cell click data
   */
  data: ICellClickData;
}

/**
 * Mouse down event type union
 */
export type TMousedownEvent = IMouseEmptyEvent | IResizeBoundaryEvent | IHeaderClickEvent | ICellClickEvent;

/**
 * Stage mouse events interface
 */
export interface IStageMouseEvent {
  /**
   * Mouse down event
   */
  mousedown$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  /**
   * Mouse move event
   */
  mouseMove$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  /**
   * Mouse up event
   */
  mouseUp$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  /**
   * Mouse down left event
   */
  mouseDownLeft$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  /**
   * Mouse up left event
   */
  mouseUpLeft$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  /**
   * Typed mouse down left event
   */
  typedMouseDownLeft$: Observable<TMousedownEvent>;
}

/**
 * Boundary resize interface
 */
export interface IBoundaryResize {
  /**
   * Sheet configuration
   */
  config: ISheetConfig;
  /**
   * Sheet dimension
   */
  sheetDimension: ISheetDimension;
  /**
   * Column boundary
   */
  columnBoundary: IItemBoundary;
  /**
   * Row boundary
   */
  rowBoundary: IItemBoundary;
  /**
   * Stage mouse events
   */
  events: IStageMouseEvent;

  /**
   * Start listening to events
   *
   * @returns A function to stop listening to events
   */
  startListening(): () => void;
}

/**
 * Selection store interface
 */
export interface ISelectionStore {
  /**
   * Stage mouse events
   */
  events: IStageMouseEvent;

  /**
   * Selection region list
   */
  list: ISelectionRegion[];

  /**
   * Observable of selection region list
   */
  list$: Observable<ISelectionRegion[]>;
}
