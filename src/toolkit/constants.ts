import { BehaviorSubject } from 'rxjs';

/**
 * Total number of rows in the table
 */
export const rowCountSubject = new BehaviorSubject(50000);
/**
 * Total number of columns in the table
 */
export const columnCountSubject = new BehaviorSubject(5000);

/**
 * Number of frozen rows
 */
export const frozenRowsSubject = new BehaviorSubject(3);
/**
 * Number of frozen columns
 */
export const frozenColumnsSubject = new BehaviorSubject(4);

/**
 * Index of the column header row: 0
 */
export const HEADER_ROW_INDEX = 0;
/**
 * Index of the row header column: 0
 */
export const HEADER_COL_INDEX = 0;

/**
 * Default data cell width
 */
export const CELL_WIDTH = 100;
/**
 * Minimum column header width
 */
export const MIN_CELL_WIDTH = 20;
/**
 * Default row header cell width
 */
export const HEADER_WIDTH = 40;
/**
 * Default data cell height
 */
export const CELL_HEIGHT = 28;
/**
 * Minimum data cell height
 */
export const MIN_CELL_HEIGHT = 15;
/**
 * Default column header height
 */
export const HEADER_HEIGHT = 30;

export const SELECTION_FILL_COLOR = 'rgba(78, 149, 255, 0.15)';
export const SELECTION_STROKE_COLOR = '#4e95ff';

/**
 * Number of buffer cells
 */
export const BUFFER_CELL_COUNT = 1;
