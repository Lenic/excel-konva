import {
  excelEntrance,
  renderedRangeColumn,
  renderedRangeRow,
  scrollXElement,
  scrollYElement,
  selectionCount,
} from './toolkit/entrance';
import { IScrollOffset, ISheetConfig } from './toolkit/helpers';
import { ICellListener, ISelectionListener } from './toolkit/renderers';
import { ServiceLocator } from './container';

const config = ServiceLocator.current.get(ISheetConfig);
config.get$('rowCount').subscribe((val) => {
  document.getElementById('total-rows')!.textContent = val.toLocaleString();
});
config.get$('columnCount').subscribe((val) => {
  document.getElementById('total-cols')!.textContent = val.toLocaleString();
});
config.get$('frozenRows').subscribe((val) => {
  document.getElementById('frozen-rows-count')!.textContent = val.toLocaleString();
});
config.get$('frozenColumns').subscribe((val) => {
  document.getElementById('frozen-cols-count')!.textContent = val.toLocaleString();
});

const cellRenderer = ServiceLocator.current.get(ICellListener);
cellRenderer.data$.subscribe((dataRegion) => {
  const { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } = dataRegion;

  renderedRangeRow.textContent = `${startRowIndex.toLocaleString()} - ${endRowIndex.toLocaleString()}`;
  renderedRangeColumn.textContent = `${startColumnIndex.toLocaleString()} - ${endColumnIndex.toLocaleString()}`;
});

const selectionRenderer = ServiceLocator.current.get(ISelectionListener);
selectionRenderer.data$.subscribe((count) => {
  selectionCount.textContent = count.toLocaleString();
});

ServiceLocator.current.get(IScrollOffset).offset$.subscribe((val) => {
  scrollXElement.textContent = val.deltaX.toFixed(0);
  scrollYElement.textContent = val.deltaY.toFixed(0);
});

excelEntrance.start();
