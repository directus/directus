<template>
	<div
		class="window"
		:style="{
			transform: `translate(${x}px, ${y}px)`,
			zIndex: 100 - window.focus,
			width: `${width}px`,
			height: `${height}px`,
		}"
		ref="windowEl"
		@pointerdown="emit('focus', window.id)"
	>
		<div class="header" @pointerdown="onPointerDown('move', $event)">
			<div class="action close" @click.stop="emit('close', props.window.id)"></div>
			<div class="action minimize" @click.stop="emit('minimize', props.window.id)"></div>
			<div class="action max" @click.stop="max"></div>
		</div>
		<Teleport to="body" :disabled="!fullscreenActive">
			<div class="content" :class="{ fullscreen: fullscreenActive }">
				<div v-if="fullscreenActive" class="close-fullscreen" @click="fullscreenActive = false"></div>
				<slot />
			</div>
		</Teleport>
		<div class="resize-handlers">
			<div class="top" @pointerdown.stop="onPointerDown('resize-top', $event)" />
			<div class="right" @pointerdown.stop="onPointerDown('resize-right', $event)" />
			<div class="bottom" @pointerdown.stop="onPointerDown('resize-bottom', $event)" />
			<div class="left" @pointerdown.stop="onPointerDown('resize-left', $event)" />
			<div class="top-left" @pointerdown.stop="onPointerDown('resize-top-left', $event)" />
			<div class="top-right" @pointerdown.stop="onPointerDown('resize-top-right', $event)" />
			<div class="bottom-right" @pointerdown.stop="onPointerDown('resize-bottom-right', $event)" />
			<div class="bottom-left" @pointerdown.stop="onPointerDown('resize-bottom-left', $event)" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Window } from './Desktop.vue';

const props = defineProps<{
	window: Window;
}>();

const emit = defineEmits<{
	(event: 'focus', id: number): void;
	(event: 'minimize', id: number): void;
	(event: 'close', id: number): void;
}>();

const x = ref(200);
const y = ref(100);
const width = ref(1200);
const height = ref(815);
const fullscreenActive = ref(false);

const windowEl = ref<HTMLElement>();
const { onPointerDown, dragging } = useDragDrop();

function max() {
	windowEl.value?.requestFullscreen();

	if (width.value === 1200) {
		width.value = window.innerWidth;
		height.value = window.innerHeight;
		x.value = 0;
		y.value = 0;
	} else {
		width.value = 1200;
		height.value = 800;
		x.value = 200;
		y.value = 100;
	}
}

function useDragDrop() {
	const dragging = ref(false);

	let pointerStartPosX = 0;
	let pointerStartPosY = 0;

	let panelStartPosX = 0;
	let panelStartPosY = 0;
	let panelStartWidth = 0;
	let panelStartHeight = 0;

	type Operation =
		| 'move'
		| 'resize-top'
		| 'resize-right'
		| 'resize-bottom'
		| 'resize-left'
		| 'resize-top-left'
		| 'resize-top-right'
		| 'resize-bottom-right'
		| 'resize-bottom-left';

	let operation: Operation = 'move';

	return { dragging, onPointerDown, onPointerUp, onPointerMove };

	function onPointerDown(op: Operation, event: PointerEvent) {
		operation = op;

		dragging.value = true;

		pointerStartPosX = event.pageX;
		pointerStartPosY = event.pageY;

		panelStartPosX = x.value;
		panelStartPosY = y.value;

		panelStartWidth = width.value;
		panelStartHeight = height.value;

		window.addEventListener('pointerup', onPointerUp);
		window.addEventListener('pointermove', onPointerMove);
	}

	function onPointerMove(event: PointerEvent) {
		if (dragging.value === false) return;

		const dx = event.pageX - pointerStartPosX;
		const dy = event.pageY - pointerStartPosY;

		if (operation === 'move') {
			x.value = panelStartPosX + dx;
			y.value = panelStartPosY + dy;
		} else {
			const minWidth = 600;
			const minHeight = 400;

			if (operation.includes('top') && minHeight < panelStartHeight - dy) {
				height.value = panelStartHeight - dy;
				y.value = panelStartPosY + dy;
			}

			if (operation.includes('right') && minWidth < panelStartWidth + dx) {
				width.value = panelStartWidth + dx;
			}

			if (operation.includes('bottom') && minHeight < panelStartHeight + dy) {
				height.value = panelStartHeight + dy;
			}

			if (operation.includes('left') && minWidth < panelStartWidth - dx) {
				width.value = panelStartWidth - dx;
				x.value = panelStartPosX + dx;
			}
		}
	}

	function onPointerUp() {
		dragging.value = false;

		window.removeEventListener('pointerup', onPointerUp);
		window.removeEventListener('pointermove', onPointerMove);
	}
}
</script>

<style scoped lang="scss">
.window {
	width: 1200px;
	height: 800px;
	display: grid;
	grid-template-rows: 30px 1fr;
	position: absolute;
	top: 0;
	left: 0;
	box-shadow: var(--card-shadow);
	border-radius: var(--border-radius);

	.header {
		background-color: var(--background-normal-alt);
		display: flex;
		align-items: center;
		padding: 10px;
		gap: 10px;
		border-radius: var(--border-radius) var(--border-radius) 0 0;

		.action {
			cursor: pointer;
			width: 10px;
			height: 10px;
			border-radius: 50%;
		}

		.close {
			background: var(--danger);
		}

		.minimize {
			background: var(--warning);
		}

		.max {
			background: var(--success);
		}
	}

	.content {
		overflow: hidden;
		border-radius: 0 0 var(--border-radius) var(--border-radius);
	}

	.resize-handlers div {
		position: absolute;
		z-index: 102;
	}

	.resize-handlers .top {
		top: -7px;
		width: 100%;
		height: 7px;
		cursor: ns-resize;
	}

	.resize-handlers .right {
		top: 0;
		right: -7px;
		width: 7px;
		height: 100%;
		cursor: ew-resize;
	}

	.resize-handlers .bottom {
		bottom: -7px;
		width: 100%;
		height: 7px;
		cursor: ns-resize;
	}

	.resize-handlers .left {
		top: 0;
		left: -7px;
		width: 7px;
		height: 100%;
		cursor: ew-resize;
	}

	.resize-handlers .top-left {
		top: -7px;
		left: -7px;
		width: 10px;
		height: 10px;
		cursor: nwse-resize;
	}

	.resize-handlers .top-right {
		top: -7px;
		right: -7px;
		width: 10px;
		height: 10px;
		cursor: nesw-resize;
	}

	.resize-handlers .bottom-right {
		right: -7px;
		bottom: -7px;
		width: 10px;
		height: 10px;
		cursor: nwse-resize;
	}

	.resize-handlers .bottom-left {
		bottom: -7px;
		left: -7px;
		width: 10px;
		height: 10px;
		cursor: nesw-resize;
	}
}
</style>
