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
import { scrollWrapper } from '../core-elements';

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

    this.offset$ = this.buildOffset();
    this.disposeWithMe(this.offset$.subscribe((value) => (this.offset = value)));

    this.top$ = this.offset$.pipe(
      map((offset) => offset.deltaY),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.top$.subscribe((value) => (this.top = value)));

    this.left$ = this.offset$.pipe(
      map((offset) => offset.deltaX),
      distinctUntilChanged(),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.disposeWithMe(this.left$.subscribe((value) => (this.left = value)));
  }

  private buildOffset() {
    return combineLatest([
      fromEvent(scrollWrapper, 'scroll').pipe(
        auditTime(16, animationFrameScheduler),
        startWith(null),
        map(() => ({ deltaX: scrollWrapper.scrollLeft, deltaY: scrollWrapper.scrollTop }) as IOffset),
        distinctUntilChanged((x, y) => x.deltaX === y.deltaX && x.deltaY === y.deltaY),
      ),
      combineLatest([this.sheetDimension.realSize$, this.sheetDimension.visualSize$]).pipe(
        map(
          ([real, visual]) => ({ width: real.width - visual.width, height: real.height - visual.height }) as IDimension,
        ),
        distinctUntilChanged((x, y) => x.width === y.width && x.height === y.height),
      ),
    ]).pipe(
      map(
        ([offset, max]) =>
          ({
            deltaX: Math.max(0, Math.min(max.width, offset.deltaX)),
            deltaY: Math.max(0, Math.min(max.height, offset.deltaY)),
          }) as IOffset,
      ),
      distinctUntilChanged((x, y) => x.deltaX === y.deltaX && x.deltaY === y.deltaY),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
  }
}
