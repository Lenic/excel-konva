import type { IOffset, IScrollOffset, TScrollOffsetChangePatch } from './types';
import type { Observable } from 'rxjs';

import { animationFrameScheduler, auditTime, distinctUntilChanged, fromEvent, map, startWith } from 'rxjs';

import { ObservableDisposable } from '../core';

/**
 * Scroll offset
 */
export class ScrollOffset extends ObservableDisposable implements IScrollOffset {
  private el: HTMLElement;

  top: number;
  left: number;
  offset: IOffset;

  change$: Observable<TScrollOffsetChangePatch>;

  /**
   * ScrollOffset constructor
   *
   * @param el - The scrollable element
   */
  constructor(el: HTMLElement) {
    super();

    this.el = el;
    this.disposeWithMe(() => void (this.el = null as unknown as HTMLElement));

    this.top = 0;
    this.disposeWithMe(() => void (this.top = 0));

    this.left = 0;
    this.disposeWithMe(() => void (this.left = 0));

    this.offset = this.getDefaultOffset();
    this.disposeWithMe(() => void (this.offset = this.getDefaultOffset()));

    this.change$ = fromEvent(this.el, 'scroll').pipe(
      auditTime(16, animationFrameScheduler),
      startWith(null),
      map(() => ({ deltaX: this.el.scrollLeft, deltaY: this.el.scrollTop }) as IOffset),
      distinctUntilChanged((x, y) => x.deltaX === y.deltaX && x.deltaY === y.deltaY),
      map((delta) => {
        const leftChanged = this.left !== delta.deltaX;
        const topChanged = this.top !== delta.deltaY;

        let patch: TScrollOffsetChangePatch | null = null;
        if (topChanged && leftChanged) {
          patch = {
            type: 'both',
            previous: this.offset,
            current: delta,
          };
        } else if (leftChanged) {
          patch = {
            type: 'left',
            previous: this.left,
            current: delta.deltaX,
          };
        } else {
          patch = {
            type: 'top',
            previous: this.top,
            current: delta.deltaY,
          };
        }

        this.left = delta.deltaX;
        this.top = delta.deltaY;

        return patch;
      }),
      this.withShare(),
    );
    this.disposeWithMe(this.change$.subscribe());
  }

  private getDefaultOffset(): IOffset {
    return { deltaX: 0, deltaY: 0 };
  }
}
