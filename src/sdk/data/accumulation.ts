import type { IAccumulatedDimensionManager, IDimensionManager, TAccumulatedDimensionPatch } from './types';
import type { Observable } from 'rxjs';

import { merge, Subject } from 'rxjs';

import { binarySearch, ObservableDisposable, TruncatableList } from '../utils';

/**
 * Accumulated dimension manager
 */
export class AccumulatedDimensionManager extends ObservableDisposable implements IAccumulatedDimensionManager {
  private count: number;
  private previousFindIndex: number;
  private previousFindOffset: number;
  private dimension: IDimensionManager;
  private dimensionList: TruncatableList<number>;
  private changeSubject: Subject<TAccumulatedDimensionPatch>;
  private dimensionRangeList: TruncatableList<[beginValue: number, endValue: number]>;

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

    this.previousFindIndex = -1;
    this.disposeWithMe(() => void (this.previousFindIndex = -1));

    this.previousFindOffset = -1;
    this.disposeWithMe(() => void (this.previousFindOffset = -1));

    this.dimension = dimension;
    this.disposeWithMe(() => void (this.dimension = undefined as unknown as IDimensionManager));

    this.count = 0;
    this.disposeWithMe(() => void (this.count = 0));
    this.disposeWithMe(
      count$.subscribe((count) => {
        const previous = this.count;
        this.count = count;

        this.changeSubject.next({ type: 'count', previous, current: count });
      }),
    );

    this.dimensionList = new TruncatableList<number>();
    this.dimensionList.push(0);
    this.disposeWithMe(this.dimensionList);

    this.dimensionRangeList = new TruncatableList<[beginValue: number, endValue: number]>();
    this.disposeWithMe(this.dimensionRangeList);

    this.disposeWithMe(
      this.change$.subscribe((patch) => {
        const index = patch.type === 'options' ? 0 : patch.type === 'dimension' ? patch.index : patch.current - 1;
        this.dimensionList.truncate(index);
        this.dimensionRangeList.truncate(index);

        this.previousFindIndex = -1;
        this.previousFindOffset = -1;
      }),
    );
  }

  get(index: number): number {
    this.checkDisposed();

    const value = this.dimensionList.get(index);
    if (typeof value === 'number') return value;

    let currentValue = this.dimensionList.get(this.dimensionList.length - 1) ?? 0;
    for (let c = this.dimensionList.length - 1; c < index; c++) {
      const nextValue = currentValue + this.dimension.get(c);

      this.dimensionList.push(nextValue);

      currentValue = nextValue;
    }

    return currentValue;
  }

  findIndex(offset: number): number {
    const list = this.dimensionRangeList;

    function comparer(mid: number) {
      const [beginValue, endValue] = list.get(mid)!;
      if (beginValue <= offset && offset < endValue) return 0;
      return beginValue > offset ? 1 : -1;
    }

    /**
     * If the previous index is not -1, try to find the index from the previous index.
     */
    if (this.previousFindIndex !== -1) {
      const result = comparer(this.previousFindIndex);
      if (result === 0) {
        this.previousFindOffset = offset;
        return this.previousFindIndex;
      }

      if (this.previousFindOffset > offset) {
        const lessIndex = this.previousFindIndex - 1;
        if (lessIndex >= 0) {
          const lessResult = comparer(lessIndex);
          if (lessResult === 0) {
            this.previousFindIndex = lessIndex;
            this.previousFindOffset = offset;
            return lessIndex;
          }
        }
      }

      if (this.previousFindIndex < offset) {
        const greaterIndex = this.previousFindIndex + 1;
        if (greaterIndex < list.length) {
          const greaterResult = comparer(greaterIndex);
          if (greaterResult === 0) {
            this.previousFindIndex = greaterIndex;
            this.previousFindOffset = offset;
            return greaterIndex;
          }
        }
      }
    }

    this.previousFindOffset = offset;

    let index = binarySearch(0, list.length - 1, comparer);
    if (index !== -1) {
      this.previousFindIndex = index;
      return index;
    }

    let c = this.dimensionRangeList.length;
    for (; c < this.count; c++) {
      const beginValue = this.get(c);
      const endValue = this.get(c + 1);

      this.dimensionRangeList.push([beginValue, endValue]);

      if (offset < endValue) {
        index = c;
        break;
      }
    }

    if (index !== -1) {
      index = Math.min(index, this.count - 1);
    }

    this.previousFindIndex = index;
    return index;
  }
}
