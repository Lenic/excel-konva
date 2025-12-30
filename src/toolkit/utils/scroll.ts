import type { IOffset } from '../types';

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

import { scrollContainer } from '../core-elements';

import { sheetRealSize$, sheetVisualSize$ } from './size';

/**
 * 获取表格的滚动偏移量
 */
export const scrollOffset$ = combineLatest([
  fromEvent(scrollContainer, 'scroll').pipe(
    auditTime(16, animationFrameScheduler),
    startWith(null),
    map(() => ({ deltaX: scrollContainer.scrollLeft, deltaY: scrollContainer.scrollTop }) as IOffset),
  ),
  combineLatest([sheetRealSize$, sheetVisualSize$]).pipe(
    map(([real, visual]) => ({ deltaX: real.width - visual.width, deltaY: real.height - visual.height }) as IOffset),
  ),
]).pipe(
  map(
    ([v, max]) =>
      // 因为初始位置的滚动值是 (0, 0)，所以不可能出现负值
      ({
        deltaX: Math.max(0, Math.min(max.deltaX, v.deltaX)),
        deltaY: Math.max(0, Math.min(max.deltaY, v.deltaY)),
      }) as IOffset,
  ),
  distinctUntilChanged((x, y) => x.deltaX === y.deltaX && x.deltaY === y.deltaY),
  shareReplay({ bufferSize: 1, refCount: true }),
);
