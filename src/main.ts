import { excelEntrance } from './toolkit/entrance';
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

  document.getElementById('rendered-range-row')!.textContent =
    `${startRowIndex.toLocaleString()} - ${endRowIndex.toLocaleString()}`;
  document.getElementById('rendered-range-column')!.textContent =
    `${startColumnIndex.toLocaleString()} - ${endColumnIndex.toLocaleString()}`;
});

const selectionRenderer = ServiceLocator.current.get(ISelectionListener);
selectionRenderer.data$.subscribe((count) => {
  document.getElementById('selection-count')!.textContent = count.toLocaleString();
});

ServiceLocator.current.get(IScrollOffset).offset$.subscribe((val) => {
  document.getElementById('scroll-x')!.textContent = val.deltaX.toFixed(0);
  document.getElementById('scroll-y')!.textContent = val.deltaY.toFixed(0);
});

excelEntrance.start();
