import type { IOffset } from '../types';
import type Konva from 'konva';

import {
  animationFrameScheduler,
  combineLatest,
  distinctUntilChanged,
  fromEvent,
  fromEventPattern,
  map,
  shareReplay,
  startWith,
  tap,
  throttleTime,
} from 'rxjs';

import { scrollContainer } from '../core-elements';
import { stage } from '../konva-items';

import { sheetRealSize$, sheetVisualSize$ } from './size';

// 连接 Canvas 的鼠标滚轮事件和滚动容器的滚动事件
fromEventPattern<Konva.KonvaEventObject<WheelEvent>>(
  (fn) => stage.on('wheel', fn),
  (fn) => stage.off('wheel', fn),
)
  .pipe(
    tap((e) => {
      e.evt.preventDefault();
    }),
  )
  .subscribe((e) => {
    scrollContainer.scrollTop = Math.max(0, scrollContainer.scrollTop + e.evt.deltaY);
    scrollContainer.scrollLeft = Math.max(0, scrollContainer.scrollLeft + e.evt.deltaX);
  });

/**
 * 获取表格的滚动偏移量
 */
export const scrollOffset$ = combineLatest([
  fromEvent(scrollContainer, 'scroll').pipe(
    throttleTime(0, animationFrameScheduler),
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
