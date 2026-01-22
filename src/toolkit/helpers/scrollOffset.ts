import type { IDimension, IExcelEntrance, IOffset } from '../types';
import type { IScrollOffset, ISheetDimension } from './types';
import type { Observable } from 'rxjs';

import {
  animationFrameScheduler,
  auditTime,
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  map,
  startWith,
} from 'rxjs';

import { ObservableDisposable } from '../core';

/**
 * Scroll offset
 */
export class ScrollOffset extends ObservableDisposable implements IScrollOffset {
  sheetDimension: ISheetDimension;

  top: number;
  left: number;
  offset: IOffset;
  excelEntrance: IExcelEntrance;

  top$: Observable<number>;
  left$: Observable<number>;
  offset$: Observable<IOffset>;

  /**
   * Constructor
   *
   * @param sheetDimension - Sheet dimension
   * @param excelEntrance - Excel entrance
   */
  constructor(sheetDimension: ISheetDimension, excelEntrance: IExcelEntrance) {
    super();

    this.sheetDimension = sheetDimension;
    this.excelEntrance = excelEntrance;

    this.top = 0;
    this.left = 0;
    this.offset = { deltaX: 0, deltaY: 0 } as IOffset;

    this.offset$ = this.buildOffset();
    this.disposeWithMe(this.offset$.subscribe((value) => (this.offset = value)));

    this.top$ = this.offset$.pipe(
      map((offset) => offset.deltaY),
      distinctUntilChanged(),
      this.withPublish(),
    );
    this.disposeWithMe(this.top$.subscribe((value) => (this.top = value)));

    this.left$ = this.offset$.pipe(
      map((offset) => offset.deltaX),
      distinctUntilChanged(),
      this.withPublish(),
    );
    this.disposeWithMe(this.left$.subscribe((value) => (this.left = value)));
  }

  private buildOffset() {
    const el = this.excelEntrance.scrollWrapper;
    return combineLatest([
      fromEvent(el, 'scroll').pipe(
        auditTime(16, animationFrameScheduler),
        startWith(null),
        map(() => ({ deltaX: el.scrollLeft, deltaY: el.scrollTop }) as IOffset),
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
      this.withPublish(),
    );
  }
}
