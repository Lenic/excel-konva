/**
 * 鼠标按下的事件类型
 */
export const MousedownTypes = {
  /**
   * 空事件
   */
  Empty: 'Empty',
  /**
   * 行列大小变动事件
   */
  ResizeBoundary: 'ResizeBoundary',
} as const;

/**
 * 鼠标检测边界的容差 (像素)
 */
export const RESIZE_TOLERANCE = 5;

/**
 * 边界类型
 */
export const BoundaryTypes = {
  /**
   * 列的边界
   */
  Column: 'column-boundary',
  /**
   * 行的边界
   */
  Row: 'row-boundary',
} as const;
