import type { IDisposable, TIdentifier } from '../../container';
import type { ICellDimension, IItemBoundary, IScrollOffset, ISheetConfig, ISheetDimension } from '../helpers';
import type { IExcelEntrance, ILocation, IRegionInfo } from '../types';
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
  /**
   * Select region event
   */
  SelectRegion: 'select-region',
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
 * Selection region interface
 */
export interface ISelectionRegion {
  /**
   * Selection region ID
   */
  id: number;
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
 * Selection region event data interface
 */
export interface ISelectionRegionEventData extends ISelectionRegion {
  /**
   * Whether multi-select mode is active (e.g. Ctrl/Cmd key pressed)
   */
  isMultiSelect: boolean;
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
 * Header click data interface
 */
export interface IHeaderClickData extends ISelectionRegionEventData {
  /**
   * Type of header click
   */
  type: EHeaderClickType;
}

/**
 * Header click event interface
 */
export interface IHeaderClickEvent {
  /**
   * Event type: header click
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
 * Cell click event interface
 */
export interface ICellClickEvent {
  /**
   * Event type: cell click
   */
  mousedownType: typeof EMousedownTypes.CellClick;
  /**
   * Original Konva event object
   */
  event: Konva.KonvaEventObject<MouseEvent>;
  /**
   * Cell click data
   */
  data: ISelectionRegionEventData;
}

/**
 * Selection region event interface
 */
export interface ISelectionRegionEvent {
  /**
   * Event type: selection region change
   */
  mousedownType: typeof EMousedownTypes.SelectRegion;
  /**
   * Original Konva event object
   */
  event: Konva.KonvaEventObject<MouseEvent>;
  /**
   * Selection region event data
   */
  data: ISelectionRegionEventData;
}

/**
 * Mouse down event type union
 */
export type TMousedownEvent =
  | IMouseEmptyEvent
  | IResizeBoundaryEvent
  | IHeaderClickEvent
  | ICellClickEvent
  | ISelectionRegionEvent;

/**
 * Stage mouse events interface
 */
export interface IStageMouseEvent extends IDisposable {
  /**
   * Cell dimension
   */
  cellDimension: ICellDimension;
  /**
   * Column boundary
   */
  columnBoundary: IItemBoundary;
  /**
   * Sheet configuration
   */
  config: ISheetConfig;
  /**
   * Row boundary
   */
  rowBoundary: IItemBoundary;
  /**
   * Sheet dimension
   */
  sheetDimension: ISheetDimension;
  /**
   * Excel entrance
   */
  excelEntrance: IExcelEntrance;

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
  /**
   * Double click event
   */
  dblclick$: Observable<Konva.KonvaEventObject<MouseEvent>>;
}
/**
 * Stage mouse events interface identifier
 */
export const IStageMouseEvent: TIdentifier<IStageMouseEvent> = Symbol('IStageMouseEvent');

/**
 * Selection store interface
 */
export interface ISelectionStore extends IDisposable {
  /**
   * Selection region list
   */
  list: ISelectionRegion[];

  /**
   * Observable of selection region list
   */
  list$: Observable<ISelectionRegion[]>;

  /**
   * Toggle the target selection
   *
   * - If the selection exists, remove it.
   * - If the selection doesn't exist, add it.
   * - If all properties except `id` are equal, they are considered the same selection.
   *
   * @param region - Selection region to toggle
   */
  toggle(region: ISelectionRegion): void;

  /**
   * Update the target selection; if it doesn't exist, add it.
   *
   * - If all properties of the existing items are equal to those of the `region`, skip it.
   *
   * @param region - Selection region to update
   */
  update(region: ISelectionRegion): void;

  /**
   * Confirm the target selection; remove any other identical selections simultaneously.
   *
   * @param id - Selection region ID
   */
  confirm(id: number): void;

  /**
   * Clear all the selections
   */
  clear(): void;

  /**
   * Override all the selections with the new selections
   */
  override(regions: ISelectionRegion[]): void;
}
/**
 * Selection store interface identifier
 */
export const ISelectionStore: TIdentifier<ISelectionStore> = Symbol('ISelectionStore');

/**
 * Event listener interface
 */
export interface IEventListener extends IDisposable {
  /**
   * Start listening to events
   *
   * @returns A function to stop listening to events
   */
  startListening(): () => void;
}

/**
 * Boundary resize listener interface
 */
export interface IBoundaryResizeListener extends IEventListener {
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
   * Excel entrance
   */
  excelEntrance: IExcelEntrance;
}
/**
 * Boundary resize listener interface identifier
 */
export const IBoundaryResizeListener: TIdentifier<IBoundaryResizeListener> = Symbol('IBoundaryResizeListener');

/**
 * Stage click listener interface
 */
export interface IStageClickListener extends IEventListener {
  /**
   * Selection store
   */
  store: ISelectionStore;
  /**
   * Stage mouse events
   */
  events: IStageMouseEvent;
}
/**
 * Stage click listener interface identifier
 */
export const IStageClickListener: TIdentifier<IStageClickListener> = Symbol('IStageClickListener');

/**
 * Stage edit listener interface
 */
export interface IStageEditListener extends IEventListener {
  /**
   * Stage mouse events
   */
  events: IStageMouseEvent;
  /**
   * Cell dimension
   */
  cellDimension: ICellDimension;
  /**
   * Scroll offset
   */
  offset: IScrollOffset;
  /**
   * Excel entrance
   */
  excelEntrance: IExcelEntrance;
}
/**
 * Stage edit listener interface identifier
 */
export const IStageEditListener: TIdentifier<IStageEditListener> = Symbol('IStageEditListener');

/**
 * Stage drag listener interface
 */
export interface IStageDragListener extends IEventListener {
  /**
   * Sheet configuration
   */
  config: ISheetConfig;
  /**
   * Selection store
   */
  store: ISelectionStore;
  /**
   * Stage mouse events
   */
  events: IStageMouseEvent;
  /**
   * Cell dimension
   */
  cellDimension: ICellDimension;
  /**
   * Excel entrance
   */
  excelEntrance: IExcelEntrance;
}
/**
 * Stage drag listener interface identifier
 */
export const IStageDragListener: TIdentifier<IStageDragListener> = Symbol('IStageDragListener');

/**
 * Cursor types
 */
export const ECursorTypes = {
  /**
   * Resize boundary
   */
  ResizeBoundary: 'Resize-Boundary',
  /**
   * Empty
   */
  Empty: 'empty',
} as const;
/**
 * Cursor types
 */
export type ECursorTypes = (typeof ECursorTypes)[keyof typeof ECursorTypes];

/**
 * Empty cursor event interface
 */
export interface IEmptyCursorEvent {
  /**
   * Cursor type: empty
   */
  type: typeof ECursorTypes.Empty;
}

/**
 * Resize boundary cursor event
 */
export interface IResizeBoundaryCursorEvent {
  /**
   * Cursor type: resize boundary
   */
  type: typeof ECursorTypes.ResizeBoundary;
  /**
   * Direction
   */
  direction: EBoundaryTypes;
}

/**
 * The cursor event
 */
export type TCursorEvent = IEmptyCursorEvent | IResizeBoundaryCursorEvent;

/**
 * Cursor listener interface
 */
export interface ICursorListener extends IEventListener {
  /**
   * Stage mouse events
   */
  events: IStageMouseEvent;
  /**
   * Cell dimension
   */
  cell: ICellDimension;
  /**
   * Scroll offset
   */
  scrollOffset: IScrollOffset;
  /**
   * Excel entrance
   */
  excelEntrance: IExcelEntrance;
}
/**
 * Cursor listener interface identifier
 */
export const ICursorListener: TIdentifier<ICursorListener> = Symbol('ICursorListener');
