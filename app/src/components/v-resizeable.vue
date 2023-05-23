<template>
	<div v-if="!disabled" ref="wrapper" class="resize-wrapper">
		<slot />

		<div
			v-if="wrapperIsVisible && !isMobile"
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
import { useElementVisibility } from '@vueuse/core';
import { useEventListener } from '@/composables/use-event-listener';
import { clamp } from 'lodash';
import { computed, ref, toRef, watch } from 'vue';

type SnapZone = {
	snapPos: number;
	width: number;
	onSnap?: () => void;
	onPointerUp?: () => void;
};

export type ResizeableOptions = { snapZones?: SnapZone[]; alwaysShowHandle?: boolean };

const props = withDefaults(
	defineProps<{
		width: number;
		defaultWidth?: number;
		minWidth?: number;
		maxWidth?: number;
		windowWidth?: number;
		disabled?: boolean;
		options?: ResizeableOptions;
	}>(),
	{
		defaultWidth: (props) => props.width,
		minWidth: (props) => props.width,
		maxWidth: Infinity,
	}
);

const emit = defineEmits<{
	'update:width': [value: number];
	dragging: [value: boolean];
}>();

const windowWidth = toRef(props, 'windowWidth');

const isMobile = computed(() => windowWidth.value && windowWidth.value < 600);

const wrapper = ref<HTMLDivElement>();
const wrapperIsVisible = useElementVisibility(wrapper);

const target = computed(() => {
	const firstChild = wrapper.value?.firstElementChild;

	if (firstChild instanceof HTMLElement && !firstChild?.classList.contains('grab-bar')) {
		return firstChild;
	}

	return undefined;
});

const internalWidth = ref(props.width);
const active = ref(false);
const dragging = ref(false);
let dragStartX = 0;
let dragStartWidth = 0;
let animationFrameID: number | null = null;

useEventListener(window, 'pointermove', onPointerMove);
useEventListener(window, 'pointerup', onPointerUp);

watch(
	[windowWidth, internalWidth, target],
	([_windowWidth, width, target]) => {
		if (!target) return;

		if (isMobile.value) {
			target.style.width = '100%';
			target.style.display = 'none';
		} else {
			target.style.width = `${width}px`;
			target.style.display = 'block';
		}
	},
	{ immediate: true }
);

watch(internalWidth, (width) => {
	emit('update:width', width);
});

watch(dragging, (dragging) => {
	emit('dragging', dragging);
});

function resetWidth() {
	internalWidth.value = props.defaultWidth;
}

function onPointerDown(event: PointerEvent) {
	if (target.value) {
		dragging.value = true;
		dragStartX = event.pageX;
		dragStartWidth = target.value.offsetWidth;
	}
}

function onPointerMove(event: PointerEvent) {
	if (!dragging.value) return;

	animationFrameID = window.requestAnimationFrame(() => {
		const newWidth = clamp(dragStartWidth + (event.pageX - dragStartX), props.minWidth, props.maxWidth);

		const snapZones = props.options?.snapZones;

		if (Array.isArray(snapZones)) {
			for (const zone of snapZones) {
				if (Math.abs(newWidth - zone.snapPos) < zone.width) {
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
