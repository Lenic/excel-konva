import { map, Observable, scan, shareReplay, startWith, Subject } from 'rxjs';
import { Disposable } from '../core';
import type { IDimensionManager, IDimensionManagerOptions } from './types';

/**
 * Dimension manager
 */
export class DimensionManager extends Disposable implements IDimensionManager {
  private options: IDimensionManagerOptions;
  private dimensionSubject: Subject<[number, number | null]>;

  dimensionStore: Map<number, number>;

  getDimension$: Observable<(index: number) => number>;

  /**
   * Constructor
   *
   * @param options - Options
   */
  constructor(options: IDimensionManagerOptions) {
    super();

    this.options = options;
    this.dimensionSubject = new Subject<[number, number | null]>();
    this.disposeWithMe(() => this.dimensionSubject.complete());

    this.dimensionStore = new Map();

    this.getDimension$ = this.rebuild();
    this.disposeWithMe(this.getDimension$.subscribe());
  }

  setDimension(index: number, value: number): void {
    if (value < this.options.minDimension) return;
    this.dimensionSubject.next([index, value]);
  }

  resetDimension(index: number): void {
    this.dimensionSubject.next([index, null]);
  }

  private rebuild(): Observable<(index: number) => number> {
    return this.dimensionSubject.pipe(
      startWith(null),
      scan((map, item) => {
        if (item === null) return map;

        const [key, value] = item;
        if (value === null) {
          map.delete(key);
        } else {
          map.set(key, value);
        }

        return map;
      }, this.dimensionStore),
      map((store) => {
        /**
         * Retrieve the dimension value for a specific index.
         *
         * @param index - The index of the item, starting from the number 0
         */
        return (index: number) => {
          const value = store.get(index);
          if (value !== undefined) return value;

          return index === 0 ? this.options.headerDimension : this.options.defaultDimension;
        };
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}
