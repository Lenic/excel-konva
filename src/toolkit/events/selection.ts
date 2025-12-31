import type { ISelectionRegion } from './types';

import { distinctUntilChanged, filter, map, merge, scan } from 'rxjs';

import { typedLeftMouseDown$ } from './core';
import { EMousedownTypes } from './types';
import { isSameSelectionRegion } from './utils';

interface IAddSelectionAction {
  type: 'add';
  region: ISelectionRegion;
}

interface IClearSelectionAction {
  type: 'clear';
}

interface IReplaceSelectionAction {
  type: 'replace';
  region: ISelectionRegion;
}

type TSelectionAction = IAddSelectionAction | IClearSelectionAction | IReplaceSelectionAction;

const wholeColumnOrRowSelection$ = typedLeftMouseDown$.pipe(
  filter((e) => e.mousedownType === EMousedownTypes.HeaderClick),
  map((e) => {
    let action: TSelectionAction;
    if (e.data.isMultiSelect) {
      action = { type: 'add', region: e.data } as TSelectionAction;
    } else {
      action = { type: 'replace', region: e.data } as TSelectionAction;
    }
    return action;
  }),
);

/**
 * Selection store
 */
export const selectionStore$ = merge(wholeColumnOrRowSelection$).pipe(
  scan((list, action) => {
    switch (action.type) {
      case 'add':
        const index = list.findIndex((region) => isSameSelectionRegion(region, action.region));
        return index === -1 ? [...list, action.region] : [...list.slice(0, index), ...list.slice(index + 1)];
      case 'clear':
        return [];
      case 'replace':
        return [action.region] as ISelectionRegion[];
      default:
        return list;
    }
  }, [] as ISelectionRegion[]),
  distinctUntilChanged(),
);
