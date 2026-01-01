import {
  renderedRangeColumn,
  renderedRangeRow,
  scrollXElement,
  scrollYElement,
  selectionCount,
  virtualContent,
} from './toolkit/core-elements';
import { click, drag, edit, resize } from './toolkit/events';
import { config, scrollOffset, sheetDimension } from './toolkit/helpers';
import { cellRenderer, selectionRenderer } from './toolkit/renderers';

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

scrollOffset.offset$.subscribe((val) => {
  scrollXElement.textContent = val.deltaX.toFixed(0);
  scrollYElement.textContent = val.deltaY.toFixed(0);
});

sheetDimension.realSize$.subscribe((dimension) => {
  virtualContent.style.width = `${dimension.width}px`;
  virtualContent.style.height = `${dimension.height}px`;
});

selectionRenderer.data$.subscribe((count) => {
  selectionCount.textContent = count.toLocaleString();
});
selectionRenderer.start();

cellRenderer.data$.subscribe((dataRegion) => {
  const { startRowIndex, endRowIndex, startColumnIndex, endColumnIndex } = dataRegion;

  renderedRangeRow.textContent = `${startRowIndex.toLocaleString()} - ${endRowIndex.toLocaleString()}`;
  renderedRangeColumn.textContent = `${startColumnIndex.toLocaleString()} - ${endColumnIndex.toLocaleString()}`;
});
cellRenderer.start();

resize.startListening();
click.startListening();
drag.startListening();
edit.startListening();
