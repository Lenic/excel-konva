import {
  renderedRangeColumn,
  renderedRangeRow,
  scrollXElement,
  scrollYElement,
  selectionCount,
  virtualContent,
} from './toolkit/core-elements';
import {
  IBoundaryResizeListener,
  ICursorListener,
  IStageClickListener,
  IStageDragListener,
  IStageEditListener,
  registerEvents,
} from './toolkit/events';
import { IScrollOffset, ISheetConfig, ISheetDimension, registerHelpers, SheetConfig } from './toolkit/helpers';
import { stage } from './toolkit/konva-items';
import { ICellListener, ISelectionListener, registerRenderers } from './toolkit/renderers';
import { Container, ServiceLocator } from './container';

const container = new Container();
registerHelpers(container, () => new SheetConfig(50000, 5000, 4, 3));
registerEvents(container);
registerRenderers(container);
ServiceLocator.setProvider(container);

const config = ServiceLocator.current.get(ISheetConfig);
config.rowCount$.subscribe((val) => {
  document.getElementById('total-rows')!.textContent = val.toLocaleString();
});
config.columnCount$.subscribe((val) => {
  document.getElementById('total-cols')!.textContent = val.toLocaleString();
});
config.frozenRows$.subscribe((val) => {
  document.getElementById('frozen-rows-count')!.textContent = val.toLocaleString();
});
config.frozenColumns$.subscribe((val) => {
  document.getElementById('frozen-cols-count')!.textContent = val.toLocaleString();
});

ServiceLocator.current.get(IScrollOffset).offset$.subscribe((val) => {
  scrollXElement.textContent = val.deltaX.toFixed(0);
  scrollYElement.textContent = val.deltaY.toFixed(0);
});

const sheetDimension = ServiceLocator.current.get(ISheetDimension);
sheetDimension.visualSize$.subscribe((size) => stage.setAttrs(size));
sheetDimension.realSize$.subscribe((dimension) => {
  virtualContent.style.width = `${dimension.width}px`;
  virtualContent.style.height = `${dimension.height}px`;
});

const selectionRenderer = ServiceLocator.current.get(ISelectionListener);
selectionRenderer.data$.subscribe((count) => {
  selectionCount.textContent = count.toLocaleString();
});
selectionRenderer.start();

const cellRenderer = ServiceLocator.current.get(ICellListener);
cellRenderer.data$.subscribe((dataRegion) => {
  const { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } = dataRegion;

  renderedRangeRow.textContent = `${startRowIndex.toLocaleString()} - ${endRowIndex.toLocaleString()}`;
  renderedRangeColumn.textContent = `${startColumnIndex.toLocaleString()} - ${endColumnIndex.toLocaleString()}`;
});
cellRenderer.start();

ServiceLocator.current.get(IBoundaryResizeListener).startListening();
ServiceLocator.current.get(IStageClickListener).startListening();
ServiceLocator.current.get(IStageDragListener).startListening();
ServiceLocator.current.get(IStageEditListener).startListening();
ServiceLocator.current.get(ICursorListener).startListening();
