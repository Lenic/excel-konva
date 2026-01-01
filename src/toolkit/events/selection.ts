import type { ISelectionRegion, ISelectionStore, IStageMouseEvent } from './types';
import type { Observable } from 'rxjs';

import { distinctUntilChanged, filter, map, merge, scan, shareReplay, switchMap } from 'rxjs';

import { Disposable } from '../core';

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

export class SelectionStore extends Disposable implements ISelectionStore {
  list: ISelectionRegion[];
  events: IStageMouseEvent;

  list$: Observable<ISelectionRegion[]>;

  constructor(events: IStageMouseEvent) {
    super();

    this.list = [];
    this.events = events;

    this.list$ = this.build();
    this.disposeWithMe(
      this.list$.subscribe((list) => {
        this.list = list;
      }),
    );
  }

  private build() {
    const wholeColumnOrRowSelection$ = this.events.typedMouseDownLeft$.pipe(
      filter((e) => e.mousedownType === EMousedownTypes.HeaderClick),
      map((e) => {
        let action: TSelectionAction;
        if (e.data.isMultiSelect) {
          action = { type: 'add', region: e.data };
        } else {
          action = { type: 'replace', region: e.data };
        }
        return action;
      }),
    );

    const cellSelection$ = this.events.typedMouseDownLeft$.pipe(
      filter((e) => e.mousedownType === EMousedownTypes.CellClick),
      map((e) => {
        return { type: 'replace', region: e.data } as TSelectionAction;
      }),
    );

    return this.dispositionSubject.pipe(
      switchMap(() => merge(wholeColumnOrRowSelection$, cellSelection$)),
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
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }
}
