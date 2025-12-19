import { BehaviorSubject } from 'rxjs';

/**
 * 表格的总行数
 */
export const rowCountSubject = new BehaviorSubject(50000);
/**
 * 表格的总列数
 */
export const columnCountSubject = new BehaviorSubject(5000);

/**
 * 冻结行的数量
 */
export const frozenRowsSubject = new BehaviorSubject(3);
/**
 * 冻结列的数量
 */
export const frozenColumnsSubject = new BehaviorSubject(4);

/**
 * 列头行的索引：0
 */
export const HEADER_ROW_INDEX = 0;
/**
 * 行头列的索引：0
 */
export const HEADER_COL_INDEX = 0;

/**
 * 默认数据单元格宽度 (C1+)
 */
export const CELL_WIDTH = 100;
/**
 * 默认行头单元格宽度 (C0)
 */
export const ROW_HEADER_WIDTH = 40;
/**
 * 默认数据单元格高度 (R1+)
 */
export const CELL_HEIGHT = 28;
/**
 * 默认表头高度 (R0)
 */
export const HEADER_HEIGHT = 30;

export const SELECTION_FILL_COLOR = 'rgba(78, 149, 255, 0.15)';
export const SELECTION_STROKE_COLOR = '#4e95ff';
