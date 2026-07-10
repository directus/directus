<script setup lang="ts">
import { TresCanvas, type TresRendererSetupContext } from '@tresjs/core';
import { WebGPURenderer } from 'three/webgpu';
import { toValue } from 'vue';
import DotGridShader from './dot-grid-shader.vue';

interface Props {
	projectColor?: string | null;
}

defineProps<Props>();

// Background is always black regardless of theme mode or project color.
const CLEAR_COLOR = '#000000';

// TSL node materials require the WebGPU renderer (falls back to WebGL2 internally).
function createRenderer({ canvas }: TresRendererSetupContext) {
	return new WebGPURenderer({ canvas: toValue(canvas), antialias: true });
}

// TresCanvas forces `position: relative` as an inline style; merge our own inline style so it
// wins and the canvas drops out of flow, letting the foreground image overlay it.
const canvasStyle = {
	position: 'absolute',
	inset: 0,
	zIndex: -1,
} as const;
</script>

<template>
	<TresCanvas
		:renderer="createRenderer"
		:clear-color="CLEAR_COLOR"
		:dpr="[1, 2]"
		class="public-shader-background"
		:style="canvasStyle"
	>
		<TresPerspectiveCamera :position="[0, 0, 10]" :look-at="[0, 0, 0]" />
		<!-- Shader scene goes here -->
		<DotGridShader :project-color="projectColor" />
	</TresCanvas>
</template>
