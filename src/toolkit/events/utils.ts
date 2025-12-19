import type Konva from 'konva';
import { fromEventPattern, shareReplay } from 'rxjs';

import { stage } from '../konva-items';

export const mousedown$ = fromEventPattern<Konva.KonvaEventObject<MouseEvent>>(
  (fn) => stage.on('mousemove', fn),
  (fn) => stage.off('mousemove', fn),
).pipe(shareReplay({ refCount: true, bufferSize: 1 }));
