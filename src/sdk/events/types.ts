import type { IDisposable, TIdentifier } from '../../container';
import type { IChangePatch, IListener, ILocation, IPoint } from '../core';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

/**
 * Mouse down event categories
 */
export const EMousedownTypes = {
  /**
   * Click on an empty or background area
   */
  Empty: 'empty',
  /**
   * Click on the boundary between rows or columns for resizing
   */
  ResizeBoundary: 'resize-boundary',
  /**
   * Click on a row or column header
   */
  HeaderClick: 'header-click',
  /**
   * Click on a regular data cell
   */
  CellClick: 'cell-click',
  /**
   * Click initiated to start a multi-cell selection region
   */
  SelectRegion: 'select-region',
} as const;

export type EMousedownTypes = (typeof EMousedownTypes)[keyof typeof EMousedownTypes];

/**
 * Boundary types identifying which axis is being resized
 */
export const EBoundaryTypes = {
  /**
   * Vertical column boundary
   */
  Column: 'column-boundary',
  /**
   * Horizontal row boundary
   */
  Row: 'row-boundary',
} as const;

export type EBoundaryTypes = (typeof EBoundaryTypes)[keyof typeof EBoundaryTypes];

/**
 * Interface for observing and handling mouse events on the Konva stage
 */
export interface IStageMouseEvent extends IDisposable {
  /**
   * Observable stream for mouse down events
   */
  mousedown$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  /**
   * Observable stream for mouse move events
   */
  mouseMove$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  /**
   * Observable stream for mouse up events
   */
  mouseUp$: Observable<Konva.KonvaEventObject<MouseEvent>>;
  /**
   * Observable stream for double-click events
   */
  dblclick$: Observable<Konva.KonvaEventObject<MouseEvent>>;
}
/**
 * Dependency injection identifier for stage mouse events
 */
export const IStageMouseEvent: TIdentifier<IStageMouseEvent> = Symbol('IStageMouseEvent');

/**
 * Dependency injection identifier for the stage dragging listener
 */
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
