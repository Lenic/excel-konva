import type { IDisposable, TIdentifier } from '../../container';
import type { IChangePatch, IListener, ILocation, IPoint } from '../core';
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
 * Stage mouse events interface
 */
export interface IStageMouseEvent extends IDisposable {
  mousedown$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  mouseMove$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  mouseUp$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  dblclick$: Observable<Konva.KonvaEventObject<MouseEvent>>;
}
export const IStageMouseEvent: TIdentifier<IStageMouseEvent> = Symbol('IStageMouseEvent');

export const IStageDragListener: TIdentifier<IListener> = Symbol('IStageDragListener');

/**
 * Represents a change patch specifically for the mouse cursor's coordinate point.
 */
export interface IMousePointChangePatch extends IChangePatch<IPoint | null> {
  /**
   * The discriminator type for point changes.
   */
  type: 'point';
}

/**
 * Represents a change patch specifically for the mouse cursor's logical location (e.g., cell identifiers).
 */
export interface IMouseLocationChangePatch extends IChangePatch<ILocation | null> {
  /**
   * The discriminator type for location changes.
   */
  type: 'location';
}

/**
 * A union type representing any change patch related to mouse movement.
 */
export type TMouseMoveChangePatch = IMousePointChangePatch | IMouseLocationChangePatch;

/**
 * Interface defining a listener that tracks mouse movement across the workspace.
 */
export interface ICursorListener extends IListener {
  /**
   * The current absolute coordinate position of the mouse.
   */
  position: IPoint | null;

  /**
   * The current logical location relative to the grid that the mouse is hovering over.
   */
  location: ILocation | null;

  /**
   * An observable stream that emits whenever the mouse movement results in a change patch.
   */
  change$: Observable<TMouseMoveChangePatch>;
}
/**
 * The dependency injection identifier for the mouse move listener.
 */
export const ICursorListener: TIdentifier<ICursorListener> = Symbol('ICursorListener');

/**
 * The dependency injection identifier for the resize item listener.
 */
export const IResizeItemListener: TIdentifier<IListener> = Symbol('IResizeItemListener');
