import type { ISheetConfig } from './helpers';
import type { Observable } from 'rxjs';

import Konva from 'konva';
import { combineLatest, fromEventPattern, map, tap } from 'rxjs';

import { Container, ServiceLocator } from '../container';

import { ObservableDisposable } from './core/disposable';
import { registerContentManagers } from './contents';
import {
  IBoundaryResizeListener,
  IStageClickListener,
  IStageDragListener,
  IStageEditListener,
  registerEvents,
} from './events';
import { ISheetDimension, registerHelpers, SheetConfig } from './helpers';
import { registerPools } from './pools';
import { ICellListener, ISelectionListener, registerRenderers } from './renderers';
import { IExcelEntrance } from './types';

/**
 * Excel entrance class
 */
export class ExcelEntrance extends ObservableDisposable implements IExcelEntrance {
  rootElement: HTMLDivElement;
  scrollWrapper: HTMLDivElement;
  virtualContent: HTMLDivElement;

  stage: Konva.Stage;
  backgroundLayer: Konva.Layer;
  selectionLayer: Konva.Layer;
  scrollableGroup: Konva.Group;
  sideGroup: Konva.Group;
  headerGroup: Konva.Group;
  cornerGroup: Konva.Group;
  resizeLine: Konva.Line;

  getCellGroup$: Observable<(rowIndex: number, columnIndex: number) => Konva.Group>;

  /**
   * Excel entrance constructor
   * @param config Sheet configuration
   */
  constructor(config: ISheetConfig) {
    super();

    this.rootElement = document.getElementById('container') as HTMLDivElement;
    this.disposeWithMe(() => {
      this.rootElement.remove();
      this.rootElement = null as unknown as HTMLDivElement;
    });

    this.scrollWrapper = document.getElementById('scroll-container') as HTMLDivElement;
    this.disposeWithMe(() => {
      this.scrollWrapper.remove();
      this.scrollWrapper = null as unknown as HTMLDivElement;
    });

    this.virtualContent = document.getElementById('virtual-content') as HTMLDivElement;
    this.disposeWithMe(() => {
      this.virtualContent.remove();
      this.virtualContent = null as unknown as HTMLDivElement;
    });

    this.stage = new Konva.Stage({ container: 'konva-container', width: 0, height: 0 });
    this.disposeWithMe(() => {
      this.stage.off().destroy();
      this.stage = null as unknown as Konva.Stage;
    });

    // Connect Canvas wheel events to scroll container scroll events
    this.disposeWithMe(
      fromEventPattern<Konva.KonvaEventObject<WheelEvent>>(
        (fn) => this.stage.on('wheel', fn),
        (fn) => this.stage.off('wheel', fn),
      )
        .pipe(
          tap((e) => {
            e.evt.preventDefault();
          }),
        )
        .subscribe((e) => {
          this.scrollWrapper.scrollTop = Math.max(0, this.scrollWrapper.scrollTop + e.evt.deltaY);
          this.scrollWrapper.scrollLeft = Math.max(0, this.scrollWrapper.scrollLeft + e.evt.deltaX);
        }),
    );

    this.backgroundLayer = new Konva.Layer();
    this.disposeWithMe(() => {
      this.backgroundLayer.destroy();
      this.backgroundLayer = null as unknown as Konva.Layer;
    });
    this.stage.add(this.backgroundLayer);

    this.selectionLayer = new Konva.Layer();
    this.disposeWithMe(() => {
      this.selectionLayer.destroy();
      this.selectionLayer = null as unknown as Konva.Layer;
    });
    this.stage.add(this.selectionLayer);

    /**
     * Helper line for resizing by dragging
     */
    this.resizeLine = new Konva.Line({
      points: [0, 0, 0, 0],
      stroke: config.options.resizeLineColor,
      strokeWidth: 2,
      dash: [4, 4],
      visible: false,
      listening: false,
    });
    this.disposeWithMe(() => {
      this.resizeLine.destroy();
      this.resizeLine = null as unknown as Konva.Line;
    });
    this.selectionLayer.add(this.resizeLine);
    this.disposeWithMe(
      config.get$('resizeLineColor').subscribe((color) => {
        this.resizeLine.stroke(color);
      }),
    );

    // Create independent Konva Groups for four areas
    this.scrollableGroup = new Konva.Group(); // R1+, C1+
    this.sideGroup = new Konva.Group(); // R1+, C0
    this.headerGroup = new Konva.Group(); // R0, C1+
    this.cornerGroup = new Konva.Group(); // R0, C0
    this.disposeWithMe(() => {
      this.scrollableGroup.destroy();
      this.sideGroup.destroy();
      this.headerGroup.destroy();
      this.cornerGroup.destroy();
      this.scrollableGroup = null as unknown as Konva.Group;
      this.sideGroup = null as unknown as Konva.Group;
      this.headerGroup = null as unknown as Konva.Group;
      this.cornerGroup = null as unknown as Konva.Group;
    });
    this.backgroundLayer.add(this.scrollableGroup, this.sideGroup, this.headerGroup, this.cornerGroup);

    const container = new Container();
    this.disposeWithMe(container);

    container.register(IExcelEntrance).set(() => this);

    registerHelpers(container, () => config);
    registerPools(container);
    registerContentManagers(container);
    registerEvents(container);
    registerRenderers(container);
    ServiceLocator.setProvider(container);

    this.getCellGroup$ = this.buildGetCellGroup$(config);
    this.disposeWithMe(this.getCellGroup$.subscribe());
  }

  start() {
    const sheetDimension = ServiceLocator.current.get(ISheetDimension);
    this.disposeWithMe(sheetDimension.visualSize$.subscribe((size) => this.stage.setAttrs(size)));
    this.disposeWithMe(
      sheetDimension.realSize$.subscribe((dimension) => {
        this.virtualContent.style.width = `${dimension.width}px`;
        this.virtualContent.style.height = `${dimension.height}px`;
      }),
    );

    ServiceLocator.current.get(ICellListener).start();
    ServiceLocator.current.get(ISelectionListener).start();

    ServiceLocator.current.get(IStageDragListener).startListening();
    ServiceLocator.current.get(IStageEditListener).startListening();
    ServiceLocator.current.get(IStageClickListener).startListening();
    ServiceLocator.current.get(IBoundaryResizeListener).startListening();
  }

  private buildGetCellGroup$(config: ISheetConfig) {
    return combineLatest([config.get$('frozenRows'), config.get$('frozenColumns')]).pipe(
      map(([frozenRows, frozenColumns]) => {
        /**
         * Get cell group by row and column index
         * @param rowIndex Row index
         * @param columnIndex Column index
         * @returns Cell group
         */
        const getCellGroup = (rowIndex: number, columnIndex: number) => {
          const isHeader = rowIndex < frozenRows;
          const isFrozenCol = columnIndex < frozenColumns;

          if (isHeader && isFrozenCol) return this.cornerGroup; // R0, C0
          if (isHeader) return this.headerGroup; // R0, C1+
          if (isFrozenCol) return this.sideGroup; // R1+, C0
          return this.scrollableGroup; // R1+, C1+
        };

        return getCellGroup;
      }),
      this.withPublish(),
    );
  }
}

export const excelEntrance = new ExcelEntrance(
  new SheetConfig({ rowCount: 50000, columnCount: 5000, frozenRows: 3, frozenColumns: 4 }),
);
