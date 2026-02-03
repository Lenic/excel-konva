import type { IDimensionChangePatch, IDimensionManager, IDimensionOptions } from './types';
import type { Observable } from 'rxjs';

import { filter, map, Subject } from 'rxjs';

import { ObservableDisposable } from '../core';

/**
 * Dimension manager
 */
export class DimensionManager extends ObservableDisposable implements IDimensionManager {
  private store: Map<number, number>;
  private options: IDimensionOptions;
  private dimensionSubject: Subject<[number, number | undefined]>;

  change$: Observable<IDimensionChangePatch>;

  /**
   * Initializes a new instance of the DimensionManager class.
   *
   * @param options$ - An observable that provides the dimension options.
   */
  constructor(options$: Observable<IDimensionOptions>) {
    super();

    this.store = new Map<number, number>();
    this.disposeWithMe(() => {
      this.store.clear();
    });

    this.options = getDefaultOptions();
    this.disposeWithMe(() => {
      this.options = getDefaultOptions();
    });

    this.disposeWithMe(
      options$.subscribe((options) => {
        this.options = options;
      }),
    );

    this.dimensionSubject = new Subject<[number, number | undefined]>();
    this.disposeWithMe(() => {
      this.dimensionSubject.complete();
    });

    this.disposeWithMe(
      this.dimensionSubject
        .pipe(
          map(([index, value]) => {
            if (typeof value === 'number') {
              this.store.set(index, value);
            } else {
              this.store.delete(index);
            }
          }),
        )
        .subscribe(),
    );

    this.change$ = this.dimensionSubject.pipe(
      map(([index, value]): IDimensionChangePatch | undefined => {
        const oldValue = this.store.get(index);
        if (oldValue === value) return;

        const defaultValue = index === 0 ? this.options.headerDimension : this.options.defaultDimension;
        return { index, previous: oldValue ?? defaultValue, current: value ?? defaultValue };
      }),
      filter((v): v is IDimensionChangePatch => !!v),
      this.withShare(),
    );
  }

  get(index: number): number {
    this.checkDisposed();

    const value = this.store.get(index);
    if (typeof value === 'number') return value;

    return index === 0 ? this.options.headerDimension : this.options.defaultDimension;
  }

  set(index: number, value?: number): void {
    this.checkDisposed();

    if (typeof value === 'number' && value < this.options.minimalDimension) return;

    this.dimensionSubject.next([index, value]);
  }
}

function getDefaultOptions(): IDimensionOptions {
  return { minimalDimension: 0, headerDimension: 0, defaultDimension: 0 };
}
