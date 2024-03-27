import { Vector2 } from '@/utils/vector2';

const PANEL_WIDTH = 14;
const PANEL_HEIGHT = 14;
const ATTACHMENT_OFFSET = new Vector2(0, 3 * 20);
const RESOLVE_OFFSET = new Vector2(PANEL_WIDTH * 20, 10 * 20);
const REJECT_OFFSET = new Vector2(PANEL_WIDTH * 20, 12 * 20);

export { PANEL_HEIGHT, PANEL_WIDTH, ATTACHMENT_OFFSET, RESOLVE_OFFSET, REJECT_OFFSET };
