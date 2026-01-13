/**
 * The root html element.
 */
export const rootElement = document.getElementById('container') as HTMLDivElement;
/**
 * The scroll wrapper html element.
 */
export const scrollWrapper = document.getElementById('scroll-container') as HTMLDivElement;
/**
 * The virtual content html element.
 */
export const virtualContent = document.getElementById('virtual-content') as HTMLDivElement;
/**
 * The cell content editor.
 */
export const editor = document.getElementById('cell-editor') as HTMLTextAreaElement;

export const selectionCount = document.getElementById('selection-count') as HTMLDivElement;
export const renderedRangeRow = document.getElementById('rendered-range-row') as HTMLDivElement;
export const renderedRangeColumn = document.getElementById('rendered-range-col') as HTMLDivElement;
export const scrollXElement = document.getElementById('scroll-x') as HTMLDivElement;
export const scrollYElement = document.getElementById('scroll-y') as HTMLDivElement;
