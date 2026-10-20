import { Vector2 } from '@/utils/vector2';

export const PANEL_WIDTH = 14;
export const PANEL_HEIGHT = 14;
export const GRID_SIZE = 18;
export const ATTACHMENT_OFFSET = new Vector2(0, 3 * GRID_SIZE);
export const RESOLVE_OFFSET = new Vector2(PANEL_WIDTH * GRID_SIZE, 10 * GRID_SIZE);
export const REJECT_OFFSET = new Vector2(PANEL_WIDTH * GRID_SIZE, 12 * GRID_SIZE);
