<template>
	<div
		class="window"
		:style="{
			transform: `translate(${x}px, ${y}px)`,
			zIndex: 100 - window.focus,
			width: `${width}px`,
			height: `${height}px`,
		}"
		@click="emit('focus', window.name)"
	>
		<div class="header" @pointerdown="onPointerDown">
			<div class="action close" @click.stop="deactivate"></div>
			<div class="action fullscreen" @click="fullscreenActive = true"></div>
			<div class="action max" @click="max"></div>
		</div>
		<Teleport to="body" :disabled="!fullscreenActive">
			<div class="content" :class="{ fullscreen: fullscreenActive }">
				<div v-if="fullscreenActive" class="close-fullscreen" @click="fullscreenActive = false"></div>
				<slot />
			</div>
		</Teleport>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { Window } from './Desktop.vue';

const props = defineProps<{
	window: Window;
}>();

const emit = defineEmits<{
	(event: 'update:window', window: Window): void;
	(event: 'focus', window: string): void;
}>();

const x = ref(200);
const y = ref(100);
const width = ref(1200);
const height = ref(800);
const fullscreenActive = ref(false);

let clickStart = {
	x: 0,
	y: 0,
};

function deactivate() {
	emit('update:window', {
		...props.window,
		active: false,
	});
}

function max() {
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

function onPointerDown(event) {
	emit('focus', props.window.name);

	clickStart = {
		x: event.clientX - x.value,
		y: event.clientY - y.value,
	};

	window.addEventListener('pointermove', onPointerMove);
	window.addEventListener('pointerup', onPointerUp);
}

function onPointerMove(event) {
	x.value = event.clientX - clickStart.x;
	y.value = event.clientY - clickStart.y;
}

function onPointerUp() {
	window.removeEventListener('pointermove', onPointerMove);
	window.removeEventListener('pointerup', onPointerUp);
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

	background: var(--background-normal);
	border-radius: var(--border-radius);
	overflow: hidden;
	box-shadow: var(--card-shadow);
	.header {
		background-color: var(--background-normal-alt);
		display: flex;
		align-items: center;
		padding: 10px;
		gap: 10px;
		.action {
			cursor: pointer;
			width: 10px;
			height: 10px;
			border-radius: 50%;
		}

		.close {
			background: var(--danger);
		}

		.fullscreen {
			background: var(--warning);
		}

		.max {
			background: var(--success);
		}
	}

	.content {
		overflow: hidden;
	}
}
</style>
