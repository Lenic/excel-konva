import type { IOffset, IScrollOffset, TOffsetChangePatch } from './types';
import type { Observable } from 'rxjs';

import { animationFrameScheduler, auditTime, distinctUntilChanged, filter, fromEvent, map } from 'rxjs';

import { getDefaultValue, ObservableDisposable } from '../utils';

/**
 * Scroll offset
 */
export class ScrollOffset extends ObservableDisposable implements IScrollOffset {
  top: number;
  left: number;
  offset: IOffset;

  change$: Observable<TOffsetChangePatch>;

  /**
   * ScrollOffset constructor
   *
   * @param el - The scrollable element
   */
  constructor(el: HTMLElement) {
    super();

    this.top = Math.round(el.scrollTop);
    this.disposeWithMe(() => void (this.top = 0));

    this.left = Math.round(el.scrollLeft);
    this.disposeWithMe(() => void (this.left = 0));

    this.offset = { deltaX: this.left, deltaY: this.top };
    this.disposeWithMe(() => void (this.offset = getDefaultValue<IOffset>()));

    this.change$ = fromEvent(el, 'scroll').pipe(
      auditTime(16, animationFrameScheduler),
      map(() => ({ deltaX: Math.round(el.scrollLeft), deltaY: Math.round(el.scrollTop) }) as IOffset),
      distinctUntilChanged((x, y) => x.deltaX === y.deltaX && x.deltaY === y.deltaY),
      map((delta) => {
        const topChanged = this.top !== delta.deltaY;
        const leftChanged = this.left !== delta.deltaX;

        let patch: TOffsetChangePatch | null = null;
        if (topChanged && leftChanged) {
          patch = {
            type: 'both',
            previous: this.offset,
            current: delta,
          };
        } else if (topChanged) {
          patch = {
            type: 'top',
            previous: this.top,
            current: delta.deltaY,
          };
        } else if (leftChanged) {
          patch = {
            type: 'left',
            previous: this.left,
            current: delta.deltaX,
          };
        }

        this.offset = delta;
        this.top = delta.deltaY;
        this.left = delta.deltaX;

        return patch;
      }),
      filter((v): v is TOffsetChangePatch => v !== null),
      this.withShare(),
    );
    this.disposeWithMe(this.change$.subscribe());
  }
}
