<template>
	<div
		v-if="!disabled"
		ref="wrapper"
		class="resize-wrapper"
		:class="{ transition: !dragging && !options?.disableTransition }"
	>
		<slot />

		<div
			v-if="targetIsVisible"
			class="grab-bar"
			:class="{ active, 'always-show': options?.alwaysShowHandle }"
			@pointerenter="active = true"
			@pointerleave="active = false"
			@pointerdown.self="onPointerDown"
			@dblclick="resetWidth"
		/>
	</div>
	<slot v-else />
</template>

<script setup lang="ts">
import { useSync } from '@directus/composables';
import { useElementVisibility, useEventListener } from '@vueuse/core';
import { clamp } from 'lodash';
import { computed, ref, watch } from 'vue';

type SnapZone = {
	snapPos: number;
	width: number;
	direction?: 'left' | 'right';
	onSnap?: () => void;
	onPointerUp?: () => void;
};

export type ResizeableOptions = { snapZones?: SnapZone[]; alwaysShowHandle?: boolean; disableTransition?: boolean };

const props = withDefaults(
	defineProps<{
		width: number;
		minWidth?: number;
		maxWidth?: number;
		defaultWidth?: number;
		disabled?: boolean;
		options?: ResizeableOptions;
	}>(),
	{
		minWidth: (props) => props.width,
		maxWidth: Infinity,
		defaultWidth: (props) => props.minWidth ?? props.width,
	}
);

const emit = defineEmits<{
	'update:width': [value: number];
	dragging: [value: boolean];
	transitionEnd: [];
}>();

const wrapper = ref<HTMLDivElement>();

const target = computed(() => {
	const firstChild = wrapper.value?.firstElementChild;

	if (firstChild instanceof HTMLElement && !firstChild?.classList.contains('grab-bar')) {
		return firstChild;
	}

	return undefined;
});

const targetIsVisible = useElementVisibility(target);

const active = ref(false);
const dragging = ref(false);
let dragStartX = 0;
let dragStartWidth = 0;
let previousX = 0;
let animationFrameID: number;
let previousCursor: string;

useEventListener(window, 'pointermove', onPointerMove);
useEventListener(window, 'pointerup', onPointerUp);

useEventListener(target, 'transitionend', (event: TransitionEvent) => {
	if (event.target === target.value && event.propertyName === 'width') {
		emit('transitionEnd');
	}
});

const internalWidth = useSync(props, 'width', emit);

watch(
	[internalWidth, target, () => props.maxWidth],
	([width, target, maxWidth]) => {
		if (!target) return;

		const finalWidth = width > maxWidth ? maxWidth : width;

		target.style.width = `${finalWidth}px`;
	},
	{ immediate: true }
);

watch(dragging, (dragging) => {
	emit('dragging', dragging);
});

function resetWidth() {
	internalWidth.value = props.defaultWidth;
}

function onPointerDown(event: PointerEvent) {
	if (target.value) {
		dragging.value = true;
		previousCursor = document.body.style.cursor;
		document.body.style.cursor = 'ew-resize';
		dragStartX = event.pageX;
		dragStartWidth = target.value.offsetWidth;
		previousX = event.pageX;
	}
}

function onPointerMove(event: PointerEvent) {
	if (!dragging.value) return;

	animationFrameID = window.requestAnimationFrame(() => {
		const newWidth = clamp(dragStartWidth + (event.pageX - dragStartX), props.minWidth, props.maxWidth);

		const snapZones = props.options?.snapZones;

		if (Array.isArray(snapZones)) {
			let direction;

			if (event.pageX < previousX) {
				direction = 'left';
			} else if (event.pageX > previousX) {
				direction = 'right';
			}

			previousX = event.pageX;

			for (const zone of snapZones) {
				if (zone.direction && !direction) return;

				if ((!zone.direction || zone.direction === direction) && Math.abs(newWidth - zone.snapPos) < zone.width) {
					internalWidth.value = zone.snapPos;

					if (zone.onSnap) zone.onSnap();
					return;
				}
			}
		}

		internalWidth.value = newWidth;
	});
}

function onPointerUp() {
	if (!dragging.value) return;

	dragging.value = false;
	document.body.style.cursor = previousCursor;

	const snapZones = props.options?.snapZones;

	if (Array.isArray(snapZones)) {
		for (const zone of snapZones) {
			if (Math.abs(props.width - zone.snapPos) < zone.width) {
				if (zone.onPointerUp) zone.onPointerUp();
				break;
			}
		}
	}

	if (animationFrameID) {
		window.cancelAnimationFrame(animationFrameID);
	}
}
</script>

<style lang="scss" scoped>
.resize-wrapper {
	position: relative;
	max-height: 100%;

	&.transition {
		:slotted(:first-child) {
			transition: width var(--slow) var(--transition);
		}
	}

	.grab-bar {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: 4px;
		z-index: 10;
		background-color: var(--primary);
		cursor: ew-resize;
		opacity: 0;
		transform: translate(50%, 0);
		transition: opacity var(--fast) var(--transition);
		transition-delay: 0;
		user-select: none;
		touch-action: none;

		&:hover,
		&:active {
			opacity: 1;
		}

		&.active {
			transition-delay: var(--slow);
		}

		&.always-show {
			opacity: 1;
			transition: background-color var(--fast) var(--transition);
			background-color: transparent;

			&::before {
				content: '';
				position: absolute;
				top: 0;
				right: 1px;
				bottom: 0;
				left: 1px;
				background-color: var(--background-normal-alt);
				transition: background-color var(--fast) var(--transition);
			}

			&:hover,
			&:active {
				background-color: var(--primary);

				&::before {
					background-color: var(--primary);
				}
			}
		}
	}
}
</style>
