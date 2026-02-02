import type { IDisposable } from '../../container';
import type { IDimension } from '../types';
import type { Observable } from 'rxjs';

/**
 * Sheet dimension
 */
export interface ISheetDimension extends IDisposable {
  /**
   * Width
   */
  width: number;
  /**
   * Height
   */
  height: number;
  /**
   * Size
   */
  size: IDimension;

  /**
   * Observable width
   */
  width$: Observable<number>;
  /**
   * Observable height
   */
  height$: Observable<number>;
  /**
   * Observable size
   */
  size$: Observable<IDimension>;
}
