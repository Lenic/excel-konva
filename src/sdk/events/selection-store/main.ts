import type { ILocation } from '../../core';
import type { ISelectionRegion, ISelectionRegionUpdater, ISelectionStore } from './types';
import type { TSelectionStoreAction } from './types.internal';
import type { Observable } from 'rxjs';

import { distinctUntilChanged, scan, startWith, Subject } from 'rxjs';

import { getDefaultValue, isSameRange, ObservableDisposable } from '../../utils';

import { SelectionRegionUpdater } from './updater';

export class SelectionStore extends ObservableDisposable implements ISelectionStore {
  private subject: Subject<TSelectionStoreAction>;

  value: ISelectionRegion[];
  value$: Observable<ISelectionRegion[]>;

  constructor() {
    super();

    this.subject = new Subject<TSelectionStoreAction>();
    this.disposeWithMe(() => {
      this.subject.complete();
    });

    this.value = [];
    this.disposeWithMe(() => void (this.value = getDefaultValue<ISelectionRegion[]>()));

    this.value$ = this.build();
    this.disposeWithMe(this.value$.subscribe((list) => void (this.value = list)));
  }

  create(startLocation: ILocation, isMultiSelect: boolean): ISelectionRegionUpdater {
    return new SelectionRegionUpdater(startLocation, (action) => {
      if (!isMultiSelect && action.type === 'add') {
        this.subject.next({ type: 'reset', regions: [action.region] });
      } else if (!isMultiSelect && action.type === 'distinct') {
        // do nothing
      } else {
        this.subject.next(action);
      }
    });
  }

  reset(regions?: ISelectionRegion[]): void {
    this.subject.next({ type: 'reset', regions });
  }

  private build() {
    return this.subject.pipe(
      startWith({ type: 'reset' } as TSelectionStoreAction),
      scan((list, action) => {
        switch (action.type) {
          case 'add': {
            return [...list, action.region];
          }

          case 'update': {
            const index = list.findIndex((v) => v.id === action.region.id);
            if (index === -1) {
              throw new Error('[SelectionStore] update action: region not found');
            }
            return [...list.slice(0, index), action.region, ...list.slice(index + 1)];
          }

          case 'delete':
          case 'distinct': {
            const index = list.findIndex((v) => v.id === action.id);
            if (index === -1) return list;

            if (action.type === 'delete') {
              return [...list.slice(0, index), ...list.slice(index + 1)];
            }

            const target = list[index];
            const filteredList = list.filter(
              (item) => item === target || (item.id !== action.id && !isSameSelection(item, target)),
            );
            return filteredList.length !== list.length ? filteredList : list;
          }

          case 'reset':
            return action.regions ?? [];

          default:
            return list;
        }
      }, this.value),
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
    isSameRange(a.range, b.range) &&
    a.activeCell.rowIndex === b.activeCell.rowIndex &&
    a.activeCell.columnIndex === b.activeCell.columnIndex
  );
}
