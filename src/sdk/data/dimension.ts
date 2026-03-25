import type { IDimensionManager, IDimensionOptions, TDimensionPatch } from './types';
import type { Observable } from 'rxjs';

import { Subject } from 'rxjs';

import { getDefaultValue, ObservableDisposable } from '../utils';

/**
 * Dimension manager
 */
export class DimensionManager extends ObservableDisposable implements IDimensionManager {
  private store: Map<number, number>;
  private options: IDimensionOptions;
  private dimensionSubject: Subject<TDimensionPatch>;

  change$: Observable<TDimensionPatch>;

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

    this.dimensionSubject = new Subject<TDimensionPatch>();
    this.disposeWithMe(() => {
      this.dimensionSubject.complete();
    });
    this.change$ = this.dimensionSubject.asObservable();

    this.options = getDefaultValue();
    this.disposeWithMe(() => void (this.options = getDefaultValue()));
    this.disposeWithMe(
      options$.subscribe((options) => {
        // the default value is `undefined`
        if (typeof this.options === 'undefined') {
          // ignore notification when `this.options === undefined`
          this.options = options;
          return;
        }

        if (
          this.options.minimalDimension === options.minimalDimension &&
          this.options.headerDimension === options.headerDimension &&
          this.options.defaultDimension === options.defaultDimension
        ) {
          return;
        }

        const previous = this.options;
        this.options = options;
        this.dimensionSubject.next({ type: 'options', previous, current: options });
      }),
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

    let currentValue = value;
    if (typeof currentValue === 'number') {
      currentValue = Math.round(currentValue);
      if (currentValue < this.options.minimalDimension) return;
    }

    const oldValue = this.store.get(index);
    if (oldValue === currentValue) return;

    const defaultValue = index === 0 ? this.options.headerDimension : this.options.defaultDimension;
    const previous = oldValue ?? defaultValue;
    const current = currentValue ?? defaultValue;

    if (typeof currentValue === 'number') {
      this.store.set(index, currentValue);
    } else {
      this.store.delete(index);
    }

    if (previous !== current) {
      this.dimensionSubject.next({ type: 'dimension', index, previous, current });
    }
  }
}
