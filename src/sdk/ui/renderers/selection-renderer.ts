import type { ISelectionRegion, ISelectionStore } from '../../events/types';
import type { IKonvaItems } from '../../reference';
import type { ILinePool, IShapePool } from '../pools/types';
import type { ILayoutCache, IViewportManager } from '../types';
import type { ISelectionRenderer } from './types';
import type Konva from 'konva';
import type { Observable } from 'rxjs';

import { map } from 'rxjs';

import { EFreezeMode } from '../../reference';

import { RenderListener } from './renderer';

/**
 * Renderer for selection regions and active cell markers
 */
export class SelectionRenderer extends RenderListener<number> implements ISelectionRenderer {
  private selectionStore: ISelectionStore;
  private selectionRectPool: IShapePool;
  private konvaItems: IKonvaItems;
  private activeShapes: Konva.Shape[] = [];

  constructor(
    selectionStore: ISelectionStore,
    _viewportManager: IViewportManager,
    _layoutCache: ILayoutCache,
    selectionRectPool: IShapePool,
    _activeCellRectPool: IShapePool,
    _activeCellLinePool: ILinePool,
    konvaItems: IKonvaItems,
  ) {
    super();
    this.selectionStore = selectionStore;
    this.selectionRectPool = selectionRectPool;
    this.konvaItems = konvaItems;

    this.disposeWithMe(() => {
      this.clearShapes();
    });
  }

  protected build(): Observable<number> {
    return this.selectionStore.list$.pipe(
      map((list) => {
        this.clearShapes();
        this.renderSelections(list);
        return list.length;
      }),
    );
  }

  private renderSelections(selections: ISelectionRegion[]): void {
    if (selections.length === 0) return;

    // For now, add selections to the NONE group in the selection layer
    const group = this.konvaItems.selection.groups[EFreezeMode.NONE];

    this.disposeWithMe(
      this.selectionRectPool.get$.subscribe((get) => {
        selections.forEach((sel) => {
          const rect = get();
          // Position it (simplified logic for now)
          // Ideally use layoutCache to get real coordinates
          console.log('Rendering selection for', sel.id);

          group.add(rect);
          this.activeShapes.push(rect);
        });
        group.getLayer()?.batchDraw();
      }),
    );
  }

  private clearShapes(): void {
    const konva = (window as any).Konva;
    this.activeShapes.forEach((shape) => {
      if (konva && shape instanceof konva.Rect) {
        this.selectionRectPool.reuse(shape as Konva.Rect);
      }
    });
    this.activeShapes = [];
    this.konvaItems.selection.layer.batchDraw();
  }
}
