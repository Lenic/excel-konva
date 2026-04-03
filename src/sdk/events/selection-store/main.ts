import type { ILocation } from '../../core';
import type { ISelectionRegion, ISelectionRegionUpdater, ISelectionStore, TSelectionRegionChangePatch } from './types';
import type { TSelectionStoreAction } from './types.internal';
import type { Observable } from 'rxjs';

import { filter, map, scan, Subject } from 'rxjs';

import { getDefaultValue, isSameRange, ObservableDisposable } from '../../utils';

import { SelectionRegionUpdater } from './updater';

export class SelectionStore extends ObservableDisposable implements ISelectionStore {
  private readonly subject: Subject<TSelectionStoreAction>;

  value: ISelectionRegion[];
  readonly change$: Observable<TSelectionRegionChangePatch>;

  constructor() {
    super();

    this.subject = new Subject<TSelectionStoreAction>();
    this.disposeWithMe(() => {
      this.subject.complete();
    });

    this.value = [];
    this.disposeWithMe(() => void (this.value = getDefaultValue<ISelectionRegion[]>()));

    this.change$ = this.subject.pipe(
      scan(
        (acc, payload) => {
          const previous = acc.current;
          const [current, action] = this.reduce(previous, payload);
          return !action ? acc : { previous, current, action };
        },
        {
          previous: [] as ISelectionRegion[],
          current: [] as ISelectionRegion[],
          action: { type: 'reset', previous: [], current: [] } as TSelectionRegionChangePatch,
        },
      ),
      filter(({ previous, current }) => previous !== current), // Only emit if the state actually changed
      map(({ current, action }) => {
        this.value = current;
        return action;
      }),
      this.withPublish(),
    );

    this.disposeWithMe(this.change$.subscribe());
  }

  create(startLocation: ILocation, isMultiSelect: boolean): ISelectionRegionUpdater {
    return new SelectionRegionUpdater(startLocation, (action) => {
      if (!isMultiSelect && action.type === 'add') {
        this.subject.next({ type: 'reset', regions: [action.region] });
      } else if (!isMultiSelect && action.type === 'distinct') {
        // No-op for non-multi-select on completion
      } else {
        this.subject.next(action);
      }
    });
  }

  reset(regions?: ISelectionRegion[]): void {
    this.subject.next({ type: 'reset', regions });
  }

  private reduce(
    list: ISelectionRegion[],
    action: TSelectionStoreAction,
  ): [ISelectionRegion[], TSelectionRegionChangePatch | null] {
    switch (action.type) {
      case 'add': {
        return [[...list, action.region], { type: 'add', region: action.region }];
      }

      case 'update': {
        const index = list.findIndex((v) => v.id === action.region.id);
        if (index === -1) {
          throw new Error('[SelectionStore] update action: region not found');
        }
        return [
          [...list.slice(0, index), action.region, ...list.slice(index + 1)],
          { type: 'update', previous: list[index], current: action.region },
        ];
      }

      case 'delete':
      case 'distinct': {
        const index = list.findIndex((v) => v.id === action.id);
        if (index === -1) return [list, null];

        if (action.type === 'delete') {
          return [[...list.slice(0, index), ...list.slice(index + 1)], { type: 'remove', region: list[index] }];
        }

        const target = list[index];
        const filteredList = list.filter((item) => item !== target && !isSameSelection(item, target));
        return filteredList.length !== list.length
          ? [filteredList, { type: 'reset', previous: list, current: filteredList }]
          : [list, null];
      }

      case 'reset': {
        const regions = action.regions ?? [];
        return [regions, { type: 'reset', previous: list, current: regions }];
      }

      default:
        return [list, null];
    }
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
