import type {
  IAccumulatedDimensionManager,
  IAccumulatedFindOptions,
  IDimensionManager,
  TAccumulatedDimensionPatch,
} from './types';
import type { Observable } from 'rxjs';

import { merge, Subject } from 'rxjs';

import { binarySearch, getDefaultValue, ObservableDisposable, TruncatableList } from '../utils';

/**
 * Accumulated dimension manager
 */
export class AccumulatedDimensionManager extends ObservableDisposable implements IAccumulatedDimensionManager {
  private count: number;
  private dimension: IDimensionManager;
  private list: TruncatableList<number>;
  private changeSubject: Subject<TAccumulatedDimensionPatch>;

  maxOffset: number;
  change$: Observable<TAccumulatedDimensionPatch>;

  /**
   * AccumulatedDimensionManager constructor
   *
   * @param dimension - The item dimension manager used to retrieve individual item sizes
   * @param count$ - An Observable that emits the total count of items
   */
  constructor(dimension: IDimensionManager, count$: Observable<number>) {
    super();

    this.changeSubject = new Subject<TAccumulatedDimensionPatch>();
    this.disposeWithMe(() => {
      this.changeSubject.complete();
    });

    this.change$ = merge(this.changeSubject, dimension.change$).pipe(this.withShare());

    this.dimension = dimension;
    this.disposeWithMe(() => void (this.dimension = getDefaultValue<IDimensionManager>()));

    this.list = new TruncatableList<number>();
    this.list.push(0);
    this.disposeWithMe(this.list);
    this.disposeWithMe(
      this.change$.subscribe((patch) => {
        this.list.truncate(patch.type === 'options' ? 0 : patch.type === 'dimension' ? patch.index : patch.current - 1);
      }),
    );

    this.count = 0;
    this.disposeWithMe(() => void (this.count = 0));
    this.maxOffset = 0;
    this.disposeWithMe(() => void (this.maxOffset = 0));
    this.disposeWithMe(
      count$.subscribe((count) => {
        const previous = this.count;
        this.count = count;
        this.maxOffset = this.get(count);

        this.changeSubject.next({ type: 'count', previous, current: count });
      }),
    );
  }

  get(index: number): number {
    this.checkDisposed();

    const value = this.list.get(index);
    if (typeof value === 'number') return value;

    let currentValue = this.list.get(this.list.length - 1) ?? 0;
    for (let c = this.list.length - 1; c < index; c++) {
      const nextValue = currentValue + this.dimension.get(c);

      this.list.push(nextValue);

      currentValue = nextValue;
    }

    return currentValue;
  }

  findIndex(offset: number, options?: IAccumulatedFindOptions): number {
    const { startIndex = 0, cache, exact = 0 } = options ?? {};

    if (startIndex < 0) throw new Error('startIndex must be greater than or equal to 0');
    if (startIndex >= this.count) throw new Error('startIndex must be less than the count');

    const comparer = (mid: number) => {
      const beginValue = this.get(mid);
      const endValue = this.get(mid + 1);
      if (beginValue <= offset && offset < endValue) return 0;
      return offset < beginValue ? 1 : -1;
    };

    /**
     * If the cache index is not -1, try to find the index from the cache index.
     */
    if (cache && cache.index !== -1) {
      if (!comparer(cache.index)) {
        cache.offset = offset;
        return cache.index;
      }

      if (cache.offset > offset) {
        const lessIndex = cache.index - 1;
        if (lessIndex >= 0) {
          if (!comparer(lessIndex)) {
            cache.index = lessIndex;
            cache.offset = offset;
            return lessIndex;
          }
        }
      }

      if (cache.offset < offset) {
        const greaterIndex = cache.index + 1;
        if (greaterIndex < this.count) {
          if (!comparer(greaterIndex)) {
            cache.index = greaterIndex;
            cache.offset = offset;
            return greaterIndex;
          }
        }
      }
    }

    let beginIndex = startIndex;
    let endIndex = this.count - 1;

    if (cache && cache.index !== -1) {
      if (cache.offset > offset) {
        endIndex = Math.min(this.count - 1, cache.index);
      } else if (cache.offset < offset && startIndex <= cache.index) {
        beginIndex = cache.index;
      }
    }

    const index = binarySearch(beginIndex, endIndex, comparer, exact);
    if (index !== -1) {
      if (cache) {
        cache.index = index;
        cache.offset = offset;
      }
      return index;
    }
    return index;
  }
}
