import type { ICellRange, IOffset } from '../core';
import type { IRectBox, IViewport, TViewportChangePatch } from './types';
import type { Observable } from 'rxjs';

import { Subject } from 'rxjs';

import { getDefaultValue, ObservableDisposable } from '../utils';

export class Viewport extends ObservableDisposable implements IViewport {
  box: IRectBox;
  offset: IOffset;
  range: ICellRange;

  change$: Observable<TViewportChangePatch>;

  constructor(box$: Observable<IRectBox>, offset$: Observable<IOffset>, range$: Observable<ICellRange>) {
    super();

    const subject = new Subject<TViewportChangePatch>();
    this.disposeWithMe(() => {
      subject.complete();
    });
    this.change$ = subject.asObservable();

    this.box = getDefaultValue<IRectBox>();
    this.disposeWithMe(() => void (this.box = getDefaultValue<IRectBox>()));
    this.disposeWithMe(
      box$.subscribe((current) => {
        if (typeof this.box === 'undefined') {
          this.box = current;
          return;
        }

        const previous = this.box;
        this.box = current;
        subject.next({ type: 'box', previous, current });
      }),
    );

    this.offset = getDefaultValue<IOffset>();
    this.disposeWithMe(() => void (this.offset = getDefaultValue<IOffset>()));
    this.disposeWithMe(
      offset$.subscribe((current) => {
        if (typeof this.offset === 'undefined') {
          this.offset = current;
          return;
        }

        const previous = this.offset;
        this.offset = current;
        subject.next({ type: 'offset', previous, current });
      }),
    );

    this.range = getDefaultValue<ICellRange>();
    this.disposeWithMe(() => void (this.range = getDefaultValue<ICellRange>()));
    this.disposeWithMe(
      range$.subscribe((current) => {
        if (typeof this.range === 'undefined') {
          this.range = current;
          return;
        }

        const previous = this.range;
        this.range = current;
        subject.next({ type: 'range', previous, current });
      }),
    );
  }
}
