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
        (acc, action) => {
          const [current, actionPatch] = this.performTransition(acc.current, action);
          return { previous: acc.current, current, actionPatch };
        },
        { previous: this.value, current: this.value, actionPatch: null } as ISelectionStoreState,
      ),
      filter((v): v is ISelectionStoreState & { actionPatch: TSelectionRegionChangePatch } => !!v.actionPatch),
      map(({ current, actionPatch }) => {
        this.value = current;
        return actionPatch;
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

  private performTransition(
    list: ISelectionRegion[],
    action: TSelectionStoreAction,
  ): [ISelectionRegion[], TSelectionRegionChangePatch | null] {
    switch (action.type) {
      case 'add': {
        const nextList = [...list, action.region];
        return [nextList, { type: 'add', region: action.region }];
      }

      case 'update': {
        const index = list.findIndex((v) => v.id === action.region.id);
        if (index === -1) return [list, null];

        const nextList = [...list.slice(0, index), action.region, ...list.slice(index + 1)];
        return [nextList, { type: 'update', previous: list[index], current: action.region }];
      }

      case 'delete': {
        const index = list.findIndex((v) => v.id === action.id);
        if (index === -1) return [list, null];

        const nextList = [...list.slice(0, index), ...list.slice(index + 1)];
        return [nextList, { type: 'remove', region: list[index] }];
      }

      case 'distinct': {
        const index = list.findIndex((v) => v.id === action.id);
        if (index === -1) return [list, null];

        const target = list[index];
        // Exclusive Distinct: If a duplicate selection exists, remove both.
        const hasDuplicate = list.some((item) => item !== target && isSameSelection(item, target));
        if (hasDuplicate) {
          const nextList = list.filter((item) => !isSameSelection(item, target));
          return [nextList, { type: 'reset', previous: list, current: nextList }];
        }

        return [list, null];
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

interface ISelectionStoreState {
  previous: ISelectionRegion[];
  current: ISelectionRegion[];
  actionPatch: TSelectionRegionChangePatch | null;
}
