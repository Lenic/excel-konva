import type { IDisposable, TIdentifier } from '../../../container';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

/**
 * Common interface for all render listeners
 */
export interface IRenderListener<T> extends IDisposable {
  /**
   * Current data state of the renderer
   */
  data: T | null;

  /**
   * Observable that emits data state changes
   */
  data$: Observable<T>;

  /**
   * Starts the rendering listener
   *
   * @returns A function that can be used to stop the rendering listener
   */
  start(): () => void;
}

/**
 * Identifier for ICellRenderer in the DI container
 */
export const ICellRenderer: TIdentifier<IRenderListener<void>> = Symbol('ICellRenderer');

/**
 * Identifier for ISelectionRenderer in the DI container
 */
export const ISelectionRenderer: TIdentifier<IRenderListener<number>> = Symbol('ISelectionRenderer');

/**
 * Shape style configuration interface
 */
export interface IShapeStyleConfig extends IDisposable {
  /**
   * Observable that emits default rect attributes
   */
  defaultRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits default odd rect attributes
   */
  defaultOddRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits default even rect attributes
   */
  defaultEvenRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits frozen rect attributes
   */
  frozenRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits frozen odd rect attributes
   */
  frozenOddRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits frozen even rect attributes
   */
  frozenEvenRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits header rect attributes
   */
  headerRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits column header rect attributes
   */
  columnHeaderRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits row header rect attributes
   */
  rowHeaderRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits corner cell rect attributes
   */
  cornerCellRectAttrs$: Observable<Partial<Konva.RectConfig>>;

  /**
   * Observable that emits default text attributes
   */
  defaultTextAttrs$: Observable<Partial<Konva.TextConfig>>;

  /**
   * Observable that emits default odd text attributes
   */
  defaultOddTextAttrs$: Observable<Partial<Konva.TextConfig>>;

  /**
   * Observable that emits default even text attributes
   */
  defaultEvenTextAttrs$: Observable<Partial<Konva.TextConfig>>;

  /**
   * Observable that emits frozen text attributes
   */
  frozenTextAttrs$: Observable<Partial<Konva.TextConfig>>;

  /**
   * Observable that emits frozen even text attributes
   */
  frozenOddTextAttrs$: Observable<Partial<Konva.TextConfig>>;

  /**
   * Observable that emits frozen odd text attributes
   */
  frozenEvenTextAttrs$: Observable<Partial<Konva.TextConfig>>;

  /**
   * Observable that emits header text attributes
   */
  headerTextAttrs$: Observable<Partial<Konva.TextConfig>>;

  /**
   * Observable that emits column header text attributes
   */
  columnHeaderTextAttrs$: Observable<Partial<Konva.TextConfig>>;

  /**
   * Observable that emits row header text attributes
   */
  rowHeaderTextAttrs$: Observable<Partial<Konva.TextConfig>>;
}
/**
 * Identifier for IShapeStyleConfig in the DI container
 */
export const IShapeStyleConfig: TIdentifier<IShapeStyleConfig> = Symbol('IShapeStyleConfig');
