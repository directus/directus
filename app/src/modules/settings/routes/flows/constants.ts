import { Vector2 } from '@/utils/vector2';

const PANEL_WIDTH = 14;
const PANEL_HEIGHT = 14;
const ATTACHMENT_OFFSET = new Vector2(-2, 3 * 20);
const RESOLVE_OFFSET = new Vector2(10 * 20, PANEL_WIDTH * 20 - 2);
const REJECT_OFFSET = new Vector2(12 * 20, PANEL_WIDTH * 20 - 2);
export { PANEL_HEIGHT, PANEL_WIDTH, ATTACHMENT_OFFSET, RESOLVE_OFFSET, REJECT_OFFSET };
