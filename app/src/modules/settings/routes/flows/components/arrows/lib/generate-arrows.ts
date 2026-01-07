import { GRID_SIZE, REJECT_OFFSET, RESOLVE_OFFSET } from '../../../constants';
import { ParentInfo } from '../../../flow.vue';
import type { ArrowInfo, Target } from '../../operation.vue';
import type { Arrow, Panel } from '../types';
import { getPoints } from '../utils/get-points';
import { createLine } from './create-line';

export interface GenerateArrowsContext {
	/** Whether or not the flow is being edited. This modifies the hover state of some arrows */
	editMode: boolean;

	/** Lookup table for panels that have known resolve panels attached */
	parentPanels: Record<string, ParentInfo>;

	/** Where a preview arrow should point to during a drag and drop operation of a resolve/reject target */
	arrowInfo: ArrowInfo | undefined;

	/** What panel is currently being hovered over. Renders preview arrows for resolve/reject */
	hoveredPanel: string | null;

	/** Canvas size of the SVG the arrows will be rendered in */
	size: { width: number; height: number };
}

/**
 * Generates SVG arrow paths for connecting flow diagram panels based on their resolve/reject relationships.
 *
 * This function creates an array of Arrow objects that represent visual connections between flow panels,
 * handling multiple scenarios including:
 *
 * **Arrow Types Generated:**
 * - **Resolve Arrows**: Connect panels to their success/resolve targets (green paths)
 * - **Reject Arrows**: Connect panels to their error/reject targets (red paths)
 * - **Preview Arrows**: Show during drag-and-drop operations for live feedback
 * - **Hint Arrows**: Display placeholder arrows in edit mode for panels without connections
 *
 * **Rendering Modes:**
 * 1. **Static Mode**: Shows established connections between linked panels
 * 2. **Edit Mode**: Adds hint arrows for potential connections when hovering
 * 3. **Drag Mode**: Displays preview arrow following cursor during drag operations
 *
 * **Arrow Positioning:**
 * - Uses `RESOLVE_OFFSET` and `REJECT_OFFSET` constants for consistent arrow attachment points
 * - Calculates optimal paths using collision avoidance via `createLine` function
 * - Supports both direct connections and complex routing around obstacles
 *
 * @param panels - Array of flow panels to analyze for arrow generation. Each panel contains
 *                 resolve/reject target IDs and positioning information.
 * @param context - Configuration object controlling arrow generation behavior
 * @param context.editMode - When true, shows hint arrows for hovering and potential connections
 * @param context.parentPanels - Lookup table for panel hierarchy to determine "loner" status
 * @param context.arrowInfo - Active drag operation details for preview arrow rendering
 * @param context.hoveredPanel - Currently hovered panel ID for showing hint arrows
 * @param context.size - Canvas dimensions for boundary calculations (currently unused)
 *
 * @returns Array of Arrow objects containing:
 *   - `id`: Unique identifier combining panel ID and arrow type (e.g., "panel1_resolve")
 *   - `d`: SVG path string for rendering the arrow line and arrowhead
 *   - `type`: Arrow type ("resolve" or "reject") for styling purposes
 *   - `loner`: Boolean indicating if panel has no parent connections (affects styling)
 *   - `isHint`: Optional boolean marking preview/hint arrows vs established connections
 *
 * @example
 * ```typescript
 * const panels = [
 *   { id: 'start', x: 1, y: 1, resolve: 'middle', reject: 'error' },
 *   { id: 'middle', x: 3, y: 1, resolve: 'end', reject: '' },
 *   { id: 'end', x: 5, y: 1, resolve: '', reject: '' },
 *   { id: 'error', x: 3, y: 3, resolve: '', reject: '' }
 * ];
 *
 * const context = {
 *   editMode: false,
 *   parentPanels: {},
 *   arrowInfo: undefined,
 *   hoveredPanel: null,
 *   size: { width: 800, height: 600 }
 * };
 *
 * const arrows = generateArrows(panels, context);
 * // Returns arrows connecting: start→middle, start→error, middle→end
 * ```
 *
 * @example
 * ```typescript
 * // Edit mode with hover showing hint arrows
 * const context = {
 *   editMode: true,
 *   parentPanels: {},
 *   arrowInfo: undefined,
 *   hoveredPanel: 'panel1',
 *   size: { width: 800, height: 600 }
 * };
 *
 * const arrows = generateArrows(panels, context);
 * // Returns established arrows plus hint arrows for hovered panel
 * ```
 *
 * @see {@link createLine} - Used to generate optimal SVG paths between points
 * @see {@link getPoints} - Used to calculate arrow attachment coordinates
 */
export function generateArrows(panels: Panel[], context: GenerateArrowsContext): Arrow[] {
	const arrows: { id: string; d: string; type: Target; loner: boolean; isHint?: boolean }[] = [];

	for (const panel of panels) {
		const resolveChild = panels.find((pan) => pan.id === panel.resolve);
		const rejectChild = panels.find((pan) => pan.id === panel.reject);
		const parent = context.parentPanels[panel.id];
		const loner = (parent === undefined || parent.loner) && panel.id !== '$trigger';

		if (context.arrowInfo?.id === panel.id && context.arrowInfo?.type === 'resolve') {
			const { x, y } = getPoints(panel, RESOLVE_OFFSET);

			arrows.push({
				id: panel.id + '_resolve',
				d: createLine(panels, x, y, context.arrowInfo.pos.x, context.arrowInfo.pos.y),
				type: 'resolve',
				loner,
			});
		} else if (resolveChild) {
			const { x, y, toX, toY } = getPoints(panel, RESOLVE_OFFSET, resolveChild);

			arrows.push({
				id: panel.id + '_resolve',
				d: createLine(panels, x, y, toX as number, toY as number),
				type: 'resolve',
				loner,
			});
		} else if (
			context.editMode &&
			!context.arrowInfo &&
			(panel.id === '$trigger' || context.hoveredPanel === panel.id)
		) {
			const { x: resolveX, y: resolveY } = getPoints(panel, RESOLVE_OFFSET);

			arrows.push({
				id: panel.id + '_resolve',
				d: createLine(panels, resolveX, resolveY, resolveX + 3 * GRID_SIZE, resolveY),
				type: 'resolve',
				loner,
				isHint: true,
			});
		}

		if (context.arrowInfo?.id === panel.id && context.arrowInfo?.type === 'reject') {
			const { x, y } = getPoints(panel, REJECT_OFFSET);

			arrows.push({
				id: panel.id + '_reject',
				d: createLine(panels, x, y, context.arrowInfo.pos.x, context.arrowInfo.pos.y),
				type: 'reject',
				loner,
			});
		} else if (rejectChild) {
			const { x, y, toX, toY } = getPoints(panel, REJECT_OFFSET, rejectChild);

			arrows.push({
				id: panel.id + '_reject',
				d: createLine(panels, x, y, toX as number, toY as number),
				type: 'reject',
				loner,
			});
		} else if (context.editMode && !context.arrowInfo && panel.id !== '$trigger' && context.hoveredPanel === panel.id) {
			const { x: rejectX, y: rejectY } = getPoints(panel, REJECT_OFFSET);

			const toX = rejectX + 3 * GRID_SIZE;

			arrows.push({
				id: panel.id + '_reject',
				d: createLine(panels, rejectX, rejectY, toX, rejectY),
				type: 'reject',
				loner,
				isHint: true,
			});
		}
	}

	return arrows;
}
