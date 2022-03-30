<template>
	<div class="arrow-container">
		<svg :width="size.width" :height="size.height" class="arrows">
			<path v-for="(arrow, index) in arrows" :key="index" :d="arrow" />
		</svg>
	</div>
</template>

<script setup lang="ts">
import { Vector2 } from '@/utils/vector2';
import { computed } from 'vue';
import { ATTACHMENT_OFFSET, PANEL_HEIGHT, PANEL_WIDTH, REJECT_OFFSET, RESOLVE_OFFSET } from '../constants';
import { ArrowInfo } from './operation.vue';

const props = defineProps<{
	panels: Record<string, any>[];
	arrowInfo?: ArrowInfo;
}>();

const endOffset = 12;

const size = computed(() => {
	let width = 0,
		height = 0;
	for (const panel of props.panels) {
		width = Math.max(width, (panel.x + PANEL_WIDTH) * 20);
		height = Math.max(height, (panel.y + PANEL_HEIGHT) * 20);
	}
	if (props.arrowInfo) {
		width = Math.max(width, props.arrowInfo.pos.x + 10);
		height = Math.max(height, props.arrowInfo.pos.y + 10);
	}

	return { width: width + 100, height: height + 100 };
});

const arrows = computed(() => {
	const arrows: string[] = [];

	for (const panel of props.panels) {
		const resolveChild = props.panels.find((pan) => pan.id === panel.resolve);
		const rejectChild = props.panels.find((pan) => pan.id === panel.reject);

		if (props.arrowInfo?.id === panel.id && props.arrowInfo?.type === 'resolve') {
			const { x, y } = getPoints(panel, RESOLVE_OFFSET);
			arrows.push(createLine(x, y, props.arrowInfo.pos.x - 2, props.arrowInfo.pos.y));
		} else if (resolveChild) {
			const { x, y, toX, toY } = getPoints(panel, RESOLVE_OFFSET, resolveChild);
			arrows.push(createLine(x, y, toX as number, toY as number));
		}

		if (props.arrowInfo?.id === panel.id && props.arrowInfo?.type === 'reject') {
			const { x, y } = getPoints(panel, REJECT_OFFSET);
			arrows.push(createLine(x, y, props.arrowInfo.pos.x - 2, props.arrowInfo.pos.y));
		} else if (rejectChild) {
			const { x, y, toX, toY } = getPoints(panel, REJECT_OFFSET, rejectChild);
			arrows.push(createLine(x, y, toX as number, toY as number));
		}
	}

	if (props.arrowInfo) {
		arrows.push();
	}
	return arrows;

	function getPoints(panel: Record<string, any>, offset: Vector2, to?: Record<string, any>) {
		const x = (panel.x - 1) * 20 + offset.y + 2;
		const y = (panel.y - 1) * 20 + offset.x;
		if (to) {
			const toX = (to.x - 1) * 20 + ATTACHMENT_OFFSET.x + 2;
			const toY = (to.y - 1) * 20 + ATTACHMENT_OFFSET.y;

			return { x, y, toX, toY };
		}

		return { x, y };
	}

	function createLine(x: number, y: number, toX: number, toY: number) {
		if (y === toY) return generatePath(Vector2.fromMany({ x, y }, { x: toX - endOffset, y: toY }));

		if (x + 3 * 20 < toX) {
			const centerX = findBestPosition(new Vector2(x, y), new Vector2(toX, toY), 'x');
			return generatePath(
				Vector2.fromMany({ x, y }, { x: x + centerX, y }, { x: x + centerX, y: toY }, { x: toX - endOffset, y: toY })
			);
		}

		const offsetBox = 40;
		const centerY = findBestPosition(new Vector2(x + 2 * 20, y), new Vector2(toX - 2 * 20, toY), 'y');
		return generatePath(
			Vector2.fromMany(
				{ x, y },
				{ x: x + offsetBox, y },
				{ x: x + offsetBox, y: y + centerY },
				{ x: toX - offsetBox, y: y + centerY },
				{ x: toX - offsetBox, y: toY },
				{ x: toX - endOffset, y: toY }
			)
		);
	}

	function generatePath(points: Vector2[]) {
		let path = `M ${points[0]}`;

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

	function generateCorner(start: Vector2, middle: Vector2, end: Vector2) {
		return ` L ${start.moveNextTo(middle)} Q ${middle} ${end.moveNextTo(middle)}`;
	}

	function findBestPosition(from: Vector2, to: Vector2, axis: 'x' | 'y') {
		const possiblePlaces: boolean[] = [];

		const otherAxis = axis === 'x' ? 'y' : 'x';

		const { min, max } = minMaxPoint(from, to);

		const outerPoints = range(min[otherAxis], max[otherAxis], (axis === 'x' ? PANEL_WIDTH : PANEL_HEIGHT) * 20);
		const innerPoints = range(min[axis], max[axis], 20);

		for (let outer of outerPoints) {
			for (let inner = 0; inner < innerPoints.length; inner++) {
				const point = axis === 'x' ? new Vector2(innerPoints[inner], outer) : new Vector2(outer, innerPoints[inner]);
				possiblePlaces[inner] = (possiblePlaces[inner] ?? true) && !isPointInPanel(point);
			}
		}

		let pointer = Math.floor(possiblePlaces.length / 2);
		for (let i = 0; i < possiblePlaces.length; i++) {
			pointer += i * (i % 2 == 0 ? -1 : 1);
			if (possiblePlaces[pointer]) return pointer * 20;
		}

		return Math.floor((to[axis] - from[axis]) / 2 / 20) * 20;
	}

	function range(min: number, max: number, step: number) {
		const points: number[] = [];
		for (let i = min; i < max; i += step) {
			points.push(i);
		}
		points.push(max);
		return points;
	}

	function isPointInPanel(point: Vector2) {
		return (
			props.panels.findIndex(
				(panel) =>
					point.x >= (panel.x - 2) * 20 &&
					point.x <= (panel.x - 1 + PANEL_WIDTH) * 20 &&
					point.y >= (panel.y - 1) * 20 &&
					point.y <= (panel.y - 1 + PANEL_HEIGHT) * 20
			) !== -1
		);
	}

	function minMaxPoint(point1: Vector2, point2: Vector2) {
		return {
			min: new Vector2(Math.min(point1.x, point2.x), Math.min(point1.y, point2.y)),
			max: new Vector2(Math.max(point1.x, point2.x), Math.max(point1.y, point2.y)),
		};
	}
});
</script>

<style scoped lang="scss">
.arrow-container {
	position: relative;

	.arrows {
		position: absolute;
		top: 0;
		left: var(--content-padding);
		pointer-events: none;

		path {
			fill: transparent;
			stroke: var(--primary);
			stroke-width: 2px;
		}
	}
}
</style>
