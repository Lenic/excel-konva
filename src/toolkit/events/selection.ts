import type { ISelectionRegion, ISelectionStore } from './types';
import type { Observable } from 'rxjs';

import { distinctUntilChanged, scan, shareReplay, Subject } from 'rxjs';

import { Disposable } from '../core';

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

  add(region: ISelectionRegion): void {
    this.subject.next({ type: 'add', region });
  }

  clear(): void {
    this.subject.next({ type: 'clear' });
  }

  replace(region: ISelectionRegion): void {
    this.subject.next({ type: 'replace', region });
  }

  private build() {
    return this.subject.pipe(
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
      }, this.list),
      distinctUntilChanged(),
      shareReplay({ refCount: true, bufferSize: 1 }),
    );
  }
}
