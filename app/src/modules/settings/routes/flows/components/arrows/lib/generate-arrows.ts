import { Vector2 } from '@/utils/vector2';
import { GRID_SIZE, REJECT_OFFSET, RESOLVE_OFFSET } from '../../../constants';
import { ParentInfo } from '../../../flow.vue';
import type { ArrowInfo, Target } from '../../operation.vue';
import type { Arrow, Panel } from '../types';
import { generateCorner } from '../utils/generate-corner';
import { getPoints } from '../utils/get-points';
import { findBestPosition } from './find-best-position';

const START_OFFSET = 2;
const END_OFFSET = 13;

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
				d: createLine(x, y, context.arrowInfo.pos.x, context.arrowInfo.pos.y),
				type: 'resolve',
				loner,
			});
		} else if (resolveChild) {
			const { x, y, toX, toY } = getPoints(panel, RESOLVE_OFFSET, resolveChild);

			arrows.push({
				id: panel.id + '_resolve',
				d: createLine(x, y, toX as number, toY as number),
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
				d: createLine(resolveX, resolveY, resolveX + 3 * GRID_SIZE, resolveY),
				type: 'resolve',
				loner,
				isHint: true,
			});
		}

		if (context.arrowInfo?.id === panel.id && context.arrowInfo?.type === 'reject') {
			const { x, y } = getPoints(panel, REJECT_OFFSET);

			arrows.push({
				id: panel.id + '_reject',
				d: createLine(x, y, context.arrowInfo.pos.x, context.arrowInfo.pos.y),
				type: 'reject',
				loner,
			});
		} else if (rejectChild) {
			const { x, y, toX, toY } = getPoints(panel, REJECT_OFFSET, rejectChild);

			arrows.push({
				id: panel.id + '_reject',
				d: createLine(x, y, toX as number, toY as number),
				type: 'reject',
				loner,
			});
		} else if (context.editMode && !context.arrowInfo && panel.id !== '$trigger' && context.hoveredPanel === panel.id) {
			const { x: rejectX, y: rejectY } = getPoints(panel, REJECT_OFFSET);

			const toX = context.isRTL ? rejectX - 3 * GRID_SIZE : rejectX + 3 * GRID_SIZE;

			arrows.push({
				id: panel.id + '_reject',
				d: createLine(rejectX, rejectY, toX, rejectY),
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

	function createLine(x: number, y: number, toX: number, toY: number) {
		if (y === toY) {
			if (context.isRTL) {
				return generatePath(Vector2.fromMany({ x: x - START_OFFSET, y }, { x: toX + END_OFFSET, y: toY }));
			} else {
				return generatePath(Vector2.fromMany({ x: x + START_OFFSET, y }, { x: toX - END_OFFSET, y: toY }));
			}
		}

		if (x + 3 * GRID_SIZE < toX) {
			const centerX = findBestPosition(
				panels,
				new Vector2(x + 2 * GRID_SIZE, y),
				new Vector2(toX - 2 * GRID_SIZE, toY),
				'x',
			);

			return generatePath(
				Vector2.fromMany(
					{ x: x + START_OFFSET, y },
					{ x: centerX, y },
					{ x: centerX, y: toY },
					{ x: toX - END_OFFSET, y: toY },
				),
			);
		}

		const offsetBox = 40;

		const centerY = findBestPosition(
			panels,
			new Vector2(x + 2 * GRID_SIZE, y),
			new Vector2(toX - 2 * GRID_SIZE, toY),
			'y',
		);

		return generatePath(
			Vector2.fromMany(
				{ x: x + START_OFFSET, y },
				{ x: x + offsetBox, y },
				{ x: x + offsetBox, y: centerY },
				{ x: toX - offsetBox, y: centerY },
				{ x: toX - offsetBox, y: toY },
				{ x: toX - END_OFFSET, y: toY },
			),
		);
	}

	function generatePath(points: Vector2[]) {
		// Add 8px to the x axis so that the arrow not overlaps with the icon
		let path = `M ${points[0].add(new Vector2(8, 0))}`;

		if (points.length >= 3) {
			for (let i = 1; i < points.length - 1; i++) {
				path += generateCorner(points[i - 1], points[i], points[i + 1]);
			}
		}

		const arrowSize = 8;

		const arrow = `M ${points.at(-1)} L ${points
			.at(-1)
			?.clone()
			.add(new Vector2(-arrowSize, -arrowSize))} M ${points.at(-1)} L ${points
			.at(-1)
			?.clone()
			.add(new Vector2(-arrowSize, arrowSize))}`;

		return path + ` L ${points.at(-1)} ${arrow}`;
	}
}
