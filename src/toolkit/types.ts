import type Konva from 'konva';

export interface ISelectedRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
  activeRow: number;
  activeCol: number;
}

/**
 * 单元格的位置信息
 */
export interface ILocation {
  /**
   * 行索引
   */
  rowIndex: number;
  /**
   * 列索引
   */
  columnIndex: number;
}

/**
 * 坐标点
 */
export interface IPoint {
  /**
   * 横轴坐标
   */
  x: number;
  /**
   * 纵轴坐标
   */
  y: number;
}

/**
 * 滚动偏移量
 */
export interface IOffset {
  /**
   * 水平位置上的位移
   *
   * - 向右移动为正数
   * - 向左移动为负数
   */
  deltaX: number;
  /**
   * 垂直位置上的位移
   *
   * - 向下移动为正数
   * - 向上移动为负数
   */
  deltaY: number;
}

/**
 * 目标尺寸大小
 */
export interface IDimension {
  /**
   * 宽度
   */
  width: number;
  /**
   * 高度
   */
  height: number;
}

/**
 * 目标盒子的位置和大小
 */
export interface IRectBox extends IPoint, IDimension {}

/**
 * Sheet 的区域信息
 */
export interface IRegionInfo {
  /**
   * 开始的行索引
   */
  startRow: number;
  /**
   * 结束的行索引
   */
  endRow: number;
  /**
   * 开始的列索引
   */
  startColumn: number;
  /**
   * 结束的列索引
   */
  endColumn: number;
}

export interface IUserState {
  scrollX: number;
  scrollY: number;
  selectedRanges: ISelectedRange[];
  startCell: ILocation | null;
  lastRenderTime: number;
  animationFrameId: number | null;
}

export interface ICellRegionOptions {
  rectAttrs: Omit<Konva.RectConfig, 'x' | 'y' | 'width' | 'height'>;
  textAttrs: Omit<Konva.TextConfig, 'x' | 'y' | 'width' | 'height' | 'text'>;
}
