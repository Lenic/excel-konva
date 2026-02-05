import type { IDimension } from '../core';
import type { ISheetDimension, TSheetDimensionChangePatch } from './types';

import { animationFrameScheduler, auditTime, distinctUntilChanged, filter, map, Observable } from 'rxjs';

import { ObservableDisposable } from '../core';

/**
 * Sheet dimension
 */
export class SheetDimension extends ObservableDisposable implements ISheetDimension {
  width: number;
  height: number;
  size: IDimension;

  change$: Observable<TSheetDimensionChangePatch>;

  /**
   * SheetDimension constructor
   *
   * @param el - The element to observe for dimension changes
   */
  constructor(el: HTMLElement) {
    super();

    this.width = el.clientWidth;
    this.disposeWithMe(() => void (this.width = 0));

    this.height = el.clientHeight;
    this.disposeWithMe(() => void (this.height = 0));

    this.size = { width: this.width, height: this.height };
    this.disposeWithMe(() => void (this.size = { width: 0, height: 0 }));

    this.change$ = new Observable<HTMLElement>((observer) => {
      const resizeObserver = new ResizeObserver(() => {
        observer.next(el);
      });
      resizeObserver.observe(el);

      return () => {
        resizeObserver.disconnect();
      };
    }).pipe(
      auditTime(16, animationFrameScheduler),
      map((el) => ({ width: el.clientWidth, height: el.clientHeight }) as IDimension),
      distinctUntilChanged((prev, curr) => prev.width === curr.width && prev.height === curr.height),
      map((delta) => {
        const widthChanged = this.width !== delta.width;
        const heightChanged = this.height !== delta.height;

        let patch: TSheetDimensionChangePatch | null = null;
        if (widthChanged && heightChanged) {
          patch = {
            type: 'both',
            previous: this.size,
            current: delta,
          };
        } else if (widthChanged) {
          patch = {
            type: 'width',
            previous: this.width,
            current: delta.width,
          };
        } else if (heightChanged) {
          patch = {
            type: 'height',
            previous: this.height,
            current: delta.height,
          };
        }

        this.size = delta;
        this.width = delta.width;
        this.height = delta.height;

        return patch;
      }),
      filter((v): v is TSheetDimensionChangePatch => v !== null),
      this.withShare(),
    );
    this.disposeWithMe(this.change$.subscribe());
  }
}
