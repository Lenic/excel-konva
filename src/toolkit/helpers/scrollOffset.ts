import type { IDimension, IOffset } from '../types';
import type { IScrollOffset, ISheetDimension } from './types';
import type { Observable } from 'rxjs';

import {
  animationFrameScheduler,
  auditTime,
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  map,
  shareReplay,
  startWith,
} from 'rxjs';

import { ObservableDisposable } from '../core';
import { scrollContainer } from '../core-elements';

/**
 * Scroll offset
 */
export class ScrollOffset extends ObservableDisposable implements IScrollOffset {
  sheetDimension: ISheetDimension;

  top: number;
  left: number;
  offset: IOffset;

  top$: Observable<number>;
  left$: Observable<number>;
  offset$: Observable<IOffset>;

  /**
   * Constructor
   *
   * @param sheetDimension - Sheet dimension
   */
  constructor(sheetDimension: ISheetDimension) {
    super();

    this.sheetDimension = sheetDimension;

    this.top = 0;
    this.left = 0;
    this.offset = { deltaX: 0, deltaY: 0 } as IOffset;

    const scroll$ = fromEvent(scrollContainer, 'scroll').pipe(
      auditTime(16, animationFrameScheduler),
      startWith(null),
      map(() => scrollContainer),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.top$ = this.buildOffset(
      scroll$.pipe(map((el) => el.scrollTop)),
      ([real, visual]) => real.height - visual.height,
    );
    this.disposeWithMe(this.top$.subscribe((value) => (this.top = value)));

    this.left$ = this.buildOffset(
      scroll$.pipe(map((el) => el.scrollLeft)),
      ([real, visual]) => real.width - visual.width,
    );
    this.disposeWithMe(this.left$.subscribe((value) => (this.left = value)));

    this.offset$ = combineLatest([this.left$, this.top$]).pipe(
      map(([deltaX, deltaY]) => ({ deltaX, deltaY })),
      distinctUntilChanged((a, b) => a.deltaX === b.deltaX && a.deltaY === b.deltaY),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.offset$.subscribe((value) => (this.offset = value)));
  }

  private buildOffset(
    scrollValue$: Observable<number>,
    getOffsetValue: (value: [real: IDimension, visual: IDimension]) => number,
  ) {
    return combineLatest([
      scrollValue$.pipe(distinctUntilChanged()),
      combineLatest([this.sheetDimension.realSize$, this.sheetDimension.visualSize$]).pipe(
        map(getOffsetValue),
        distinctUntilChanged(),
      ),
    ]).pipe(
      map(([scrollValue, max]) => Math.max(0, Math.min(max, scrollValue))),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}
