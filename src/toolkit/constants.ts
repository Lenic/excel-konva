import { Container } from '../container';
import { ServiceLocator } from '../container/wrapper';

/**
 * Selection fill color
 */
export const SELECTION_FILL_COLOR = 'rgba(78, 149, 255, 0.15)';
/**
 * Selection stroke color
 */
export const SELECTION_STROKE_COLOR = '#4e95ff';
/**
 * Number of buffer cells
 */
export const BUFFER_CELL_COUNT = 1;
/**
 * Selection boundary uses a unified 2px border
 */
export const BORDER_STROKE = 2;

/**
 * Service locator container
 */
export const container = new Container();
ServiceLocator.setProvider(container);
