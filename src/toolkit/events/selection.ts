import type { ISelectionRegion, ISelectionStore } from './types';
import type { Observable } from 'rxjs';

import { distinctUntilChanged, scan, shareReplay, startWith, Subject } from 'rxjs';

import { ObservableDisposable } from '../core';

import { isSameSelectionRegion } from './utils';

type TSelectionAction =
  | { type: 'toggle' | 'update'; region: ISelectionRegion }
  | { type: 'clear' }
  | { type: 'override'; regions: ISelectionRegion[] }
  | { type: 'confirm'; id: number };

/**
 * Clear action
 */
const CLEAR_ACTION: TSelectionAction = { type: 'clear' };

/**
 * Selection store
 */
export class SelectionStore extends ObservableDisposable implements ISelectionStore {
  private subject: Subject<TSelectionAction>;

  list: ISelectionRegion[];

  list$: Observable<ISelectionRegion[]>;

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

  private build() {
    return this.subject.pipe(
      startWith(CLEAR_ACTION),
      scan((list, action) => {
        switch (action.type) {
          case 'toggle':
            const candidateRegion = { ...action.region, id: -1 };
            const addIndex = list.findIndex((region) => isSameSelectionRegion(region, candidateRegion));
            return addIndex === -1
              ? [...list, action.region]
              : [...list.slice(0, addIndex), ...list.slice(addIndex + 1)];
          case 'update':
            const updateIndex = list.findIndex((region) => region.id === action.region.id);
            if (updateIndex === -1) return [...list, action.region];

            const updateTarget = list[updateIndex];
            if (isSameSelectionRegion(updateTarget, { ...action.region, id: -1 })) return list;

            return [...list.slice(0, updateIndex), action.region, ...list.slice(updateIndex + 1)];
          case 'confirm':
            const checkTargetIndex = list.findIndex((region) => region.id === action.id);
            if (checkTargetIndex !== -1) {
              const checkIndex = list.findIndex((region) => isSameSelectionRegion(region, list[checkTargetIndex]));
              if (checkIndex !== -1) {
                const [left, right] = [Math.min(checkTargetIndex, checkIndex), Math.max(checkTargetIndex, checkIndex)];
                return [...list.slice(0, left), ...list.slice(left + 1, right), ...list.slice(right + 1)];
              }
            }
            return list;
          case 'clear':
            return [];
          case 'override':
            if (
              list.length === action.regions.length &&
              list.every(
                (item, i) =>
                  item.id === action.regions[i].id && isSameSelectionRegion(item, { ...action.regions[i], id: -1 }),
              )
            ) {
              return list;
            }
            return action.regions;
          default:
            return list;
        }
      }, this.list),
      distinctUntilChanged(),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }
}
