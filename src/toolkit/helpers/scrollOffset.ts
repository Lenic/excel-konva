import type { IDimension, IOffset } from '../types';
import type { IScrollOffset, ISheetDimension } from './types';
import type { Observable } from 'rxjs';

import {
  animationFrameScheduler,
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  map,
  shareReplay,
  startWith,
  throttleTime,
} from 'rxjs';

import { Disposable } from '../core';
import { scrollContainer } from '../core-elements';

/**
 * Scroll offset
 */
export class ScrollOffset extends Disposable implements IScrollOffset {
  sheetDimension: ISheetDimension;

  scrollTop: number;
  scrollLeft: number;
  scrollOffset: IOffset;

  scrollTop$: Observable<number>;
  scrollLeft$: Observable<number>;
  scrollOffset$: Observable<IOffset>;

  /**
   * Constructor
   *
   * @param sheetDimension - Sheet dimension
   */
  constructor(sheetDimension: ISheetDimension) {
    super();

    this.sheetDimension = sheetDimension;

    this.scrollTop = 0;
    this.scrollLeft = 0;
    this.scrollOffset = { deltaX: 0, deltaY: 0 } as IOffset;

    const scroll$ = fromEvent(scrollContainer, 'scroll').pipe(
      throttleTime(0, animationFrameScheduler, { leading: true, trailing: true }),
      startWith(null),
      map(() => scrollContainer),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

    this.scrollTop$ = this.buildOffset(
      scroll$.pipe(map((el) => el.scrollTop)),
      ([real, visual]) => real.height - visual.height,
    );
    this.disposeWithMe(this.scrollTop$.subscribe((value) => (this.scrollTop = value)));

    this.scrollLeft$ = this.buildOffset(
      scroll$.pipe(map((el) => el.scrollLeft)),
      ([real, visual]) => real.width - visual.width,
    );
    this.disposeWithMe(this.scrollLeft$.subscribe((value) => (this.scrollLeft = value)));

    this.scrollOffset$ = combineLatest([this.scrollLeft$, this.scrollTop$]).pipe(
      map(([deltaX, deltaY]) => ({ deltaX, deltaY })),
      distinctUntilChanged((a, b) => a.deltaX === b.deltaX && a.deltaY === b.deltaY),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.scrollOffset$.subscribe((value) => (this.scrollOffset = value)));
  }

  private buildOffset(
    scrollValue$: Observable<number>,
    getOffsetValue: (value: [real: IDimension, visual: IDimension]) => number,
  ) {
    return combineLatest([
      scrollValue$,
      combineLatest([this.sheetDimension.realSize$, this.sheetDimension.visualSize$]).pipe(map(getOffsetValue)),
    ]).pipe(
      map(([scrollValue, max]) => Math.max(0, Math.min(max, scrollValue))),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}
