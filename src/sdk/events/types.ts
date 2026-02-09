import type { IDisposable, TIdentifier } from '../../container';
import type { ICellRange, ILocation } from '../core';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

/**
 * Mouse down event types
 */
export const EMousedownTypes = {
  Empty: 'empty',
  ResizeBoundary: 'resize-boundary',
  HeaderClick: 'header-click',
  CellClick: 'cell-click',
  SelectRegion: 'select-region',
} as const;

export type EMousedownTypes = (typeof EMousedownTypes)[keyof typeof EMousedownTypes];

/**
 * Boundary types for resizing
 */
export const EBoundaryTypes = {
  Column: 'column-boundary',
  Row: 'row-boundary',
} as const;

export type EBoundaryTypes = (typeof EBoundaryTypes)[keyof typeof EBoundaryTypes];

/**
 * Selection region information
 */
export interface ISelectionRegion {
  id: number;
  range: ICellRange;
  activeCell: ILocation;
}

/**
 * Data associated with selection events
 */
export interface ISelectionRegionEventData extends ISelectionRegion {
  isMultiSelect: boolean;
}

/**
 * Typed mouse down event union
 */
export type TMousedownEvent =
  | { mousedownType: typeof EMousedownTypes.Empty; event: Konva.KonvaEventObject<MouseEvent> }
  | {
      mousedownType: typeof EMousedownTypes.CellClick;
      event: Konva.KonvaEventObject<MouseEvent>;
      data: ISelectionRegionEventData;
    }
  | {
      mousedownType: typeof EMousedownTypes.SelectRegion;
      event: Konva.KonvaEventObject<MouseEvent>;
      data: ISelectionRegionEventData;
    };

/**
 * Stage mouse events interface
 */
export interface IStageMouseEvent extends IDisposable {
  mousedown$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  mouseMove$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  mouseUp$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  typedMouseDownLeft$: Observable<TMousedownEvent>;
  dblclick$: Observable<Konva.KonvaEventObject<MouseEvent>>;
}

export const IStageMouseEvent: TIdentifier<IStageMouseEvent> = Symbol('IStageMouseEvent');

/**
 * Interface for storing and managing selection state
 */
export interface ISelectionStore extends IDisposable {
  readonly list: ISelectionRegion[];
  readonly list$: Observable<ISelectionRegion[]>;
  toggle(region: ISelectionRegion): void;
  update(region: ISelectionRegion): void;
  confirm(id: number): void;
  clear(): void;
  override(regions: ISelectionRegion[]): void;
}

export const ISelectionStore: TIdentifier<ISelectionStore> = Symbol('ISelectionStore');

/**
 * Basic event listener interface
 */
export interface IEventListener extends IDisposable {
  startListening(): () => void;
}

export const IStageClickListener: TIdentifier<IEventListener> = Symbol('IStageClickListener');
export const IStageDragListener: TIdentifier<IEventListener> = Symbol('IStageDragListener');
