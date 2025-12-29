import type { IItemDimension, IItemDimensionOptions } from './types';
import type { Observable } from 'rxjs';

import { combineLatest, map, scan, shareReplay, startWith, Subject } from 'rxjs';

import { Disposable } from '../core';

/**
 * Dimension manager
 */
export class ItemDimension extends Disposable implements IItemDimension {
  private minDimension: number;
  private dimensionSubject: Subject<[number, number | null]>;

  store: Map<number, number>;

  options$: Observable<IItemDimensionOptions>;
  get$: Observable<(index: number) => number>;

  /**
   * Constructor
   *
   * @param options$ - Observable Options
   */
  constructor(options$: Observable<IItemDimensionOptions>) {
    super();

    this.minDimension = 0;
    this.options$ = options$.pipe(shareReplay({ bufferSize: 1, refCount: true }));
    this.disposeWithMe(
      this.options$.subscribe((options) => {
        this.minDimension = options.minDimension;
      }),
    );

    this.dimensionSubject = new Subject<[number, number | null]>();
    this.disposeWithMe(() => {
      this.dimensionSubject.complete();
    });

    this.store = new Map();
    this.disposeWithMe(() => {
      this.store.clear();
    });

    this.get$ = this.build();
    this.disposeWithMe(this.get$.subscribe());
  }

  set(index: number, value: number): void {
    if (value < this.minDimension) return;
    this.dimensionSubject.next([index, value]);
  }

  reset(index: number): void {
    this.dimensionSubject.next([index, null]);
  }

  private build(): Observable<(index: number) => number> {
    return combineLatest([
      this.options$,
      this.dimensionSubject.pipe(
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
        }, this.store),
      ),
    ]).pipe(
      map(([options, store]) => {
        /**
         * Retrieve the dimension value for a specific index.
         *
         * @param index - The index of the item, starting from the number 0
         */
        return (index: number) => {
          const value = store.get(index);
          if (value !== undefined) return value;

          return index === 0 ? options.headerDimension : options.defaultDimension;
        };
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}
