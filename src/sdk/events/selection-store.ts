import type { ISelectionRegion, ISelectionStore } from './types';
import type { Observable } from 'rxjs';

import { distinctUntilChanged, scan, startWith, Subject } from 'rxjs';
import { ObservableDisposable } from '../utils';

/**
 * Internal action types for selection state management
 */
type TSelectionAction =
  | { type: 'toggle' | 'update'; region: ISelectionRegion }
  | { type: 'clear' }
  | { type: 'override'; regions: ISelectionRegion[] }
  | { type: 'confirm'; id: number };

const CLEAR_ACTION: TSelectionAction = { type: 'clear' };

/**
 * Selection store implementation
 */
export class SelectionStore extends ObservableDisposable implements ISelectionStore {
  private subject: Subject<TSelectionAction>;

  /**
   * Cached list of current selections
   */
  list: ISelectionRegion[];

  /**
   * Observable for selection changes
   */
  list$: Observable<ISelectionRegion[]>;

  /**
   * Initializes a new instance of the SelectionStore class.
   */
  constructor() {
    super();

    this.subject = new Subject<TSelectionAction>();
    this.disposeWithMe(() => {
      this.subject.complete();
    });

    this.list = [];

    this.list$ = this.build();
    this.disposeWithMe(
      this.list$.subscribe((list) => {
        this.list = list;
      }),
    );
  }

  toggle(region: ISelectionRegion): void {
    this.subject.next({ type: 'toggle', region });
  }

  update(region: ISelectionRegion): void {
    this.subject.next({ type: 'update', region });
  }

  confirm(id: number): void {
    this.subject.next({ type: 'confirm', id });
  }

  clear(): void {
    this.subject.next(CLEAR_ACTION);
  }

  override(regions: ISelectionRegion[]): void {
    this.subject.next({ type: 'override', regions });
  }

  /**
   * Builds the state management pipeline
   */
  private build() {
    return this.subject.pipe(
      startWith(CLEAR_ACTION),
      scan((list, action) => {
        switch (action.type) {
          case 'toggle': {
            const index = list.findIndex((r) => isSameSelection(r, action.region));
            return index === -1 ? [...list, action.region] : [...list.slice(0, index), ...list.slice(index + 1)];
          }
          case 'update': {
            const index = list.findIndex((r) => r.id === action.region.id);
            if (index === -1) return [...list, action.region];
            if (isSameSelection(list[index], action.region)) return list;
            return [...list.slice(0, index), action.region, ...list.slice(index + 1)];
          }
          case 'confirm': {
            const targetIndex = list.findIndex((r) => r.id === action.id);
            if (targetIndex === -1) return list;
            const targetRegion = list[targetIndex];
            const duplicateIndex = list.findIndex((r, i) => i !== targetIndex && isSameSelection(r, targetRegion));
            if (duplicateIndex === -1) return list;

            const [first, second] = [Math.min(targetIndex, duplicateIndex), Math.max(targetIndex, duplicateIndex)];
            return [...list.slice(0, first), ...list.slice(first + 1, second), ...list.slice(second + 1)];
          }
          case 'clear':
            return [];
          case 'override':
            return action.regions;
          default:
            return list;
        }
      }, this.list),
      distinctUntilChanged(),
      this.withPublish(),
    );
  }
}

/**
 * Utility to check if two selection regions represent the same range and active cell.
 */
function isSameSelection(a: ISelectionRegion, b: ISelectionRegion): boolean {
  return (
    a.range.rowStartIndex === b.range.rowStartIndex &&
    a.range.rowEndIndex === b.range.rowEndIndex &&
    a.range.columnStartIndex === b.range.columnStartIndex &&
    a.range.columnEndIndex === b.range.columnEndIndex &&
    a.activeCell.rowIndex === b.activeCell.rowIndex &&
    a.activeCell.columnIndex === b.activeCell.columnIndex
  );
}
