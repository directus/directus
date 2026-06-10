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
</script>

<template>
	<TresCanvas :renderer="createRenderer" :clear-color="CLEAR_COLOR" :dpr="[1, 2]" class="public-shader-background">
		<TresPerspectiveCamera :position="[0, 0, 10]" :look-at="[0, 0, 0]" />
		<!-- Shader scene goes here -->
		<DotGridShader :project-color="projectColor" />
	</TresCanvas>
</template>

<style lang="scss" scoped>
.public-shader-background {
	position: absolute;
	inset: 0;
	z-index: -1;
}
</style>
