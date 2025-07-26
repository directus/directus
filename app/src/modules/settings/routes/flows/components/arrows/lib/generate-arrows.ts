import { GRID_SIZE, REJECT_OFFSET, RESOLVE_OFFSET } from '../../../constants';
import { ParentInfo } from '../../../flow.vue';
import type { ArrowInfo, Target } from '../../operation.vue';
import type { Arrow, Panel } from '../types';
import { getPoints } from '../utils/get-points';
import { createLine } from './create-line';

export interface GenerateArrowsContext {
	/** Whether or not the flow is being edited. This modifies the hover state of some arrows */
	editMode: boolean;

	/** Change the svg `d` paths to match the right to left text direction */
	isRTL: boolean;

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
 * Generate an array of Arrow objects that can be rendered out to an SVG.
 *
 * @param panels Flow panels to generate arrows for
 * @param context Additional context to influence the arrow generation
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

			const toX = context.isRTL ? rejectX - 3 * GRID_SIZE : rejectX + 3 * GRID_SIZE;

			arrows.push({
				id: panel.id + '_reject',
				d: createLine(panels, rejectX, rejectY, toX, rejectY),
				type: 'reject',
				loner,
				isHint: true,
			});
		}
	}

	if (context.arrowInfo) {
		arrows.push();
	}

	return arrows;
}
