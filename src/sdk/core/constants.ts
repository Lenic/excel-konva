import type { TIdentifier } from '../../container';

/**
 * Konva container
 */
export const KONVA_CONTAINER = Symbol('KONVA_CONTAINER');

/**
 * Scroll container
 */
export const SCROLL_CONTAINER = Symbol('SCROLL_CONTAINER');

/**
 * Virtual content
 */
export const VIRTUAL_CONTENT = Symbol('VIRTUAL_CONTENT');

/**
 * UI element
 */
export const UIElement: TIdentifier<HTMLDivElement> = Symbol('UIElement');
