<script setup lang="ts">
import { TresCanvas, type TresRendererSetupContext } from '@tresjs/core';
import { TresLeches, useControls } from '@tresjs/leches';
import { Color } from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { computed, provide, toValue } from 'vue';
import DotGridShader from './dot-grid-shader.vue';
import { useThemeConfiguration } from '@/composables/use-theme-configuration';

interface Props {
	projectColor?: string | null;
}

const props = defineProps<Props>();

const { darkMode } = useThemeConfiguration();

const DEFAULT_CLEAR = '#6644ff';

const uuid = 'shader-background';
provide('uuid', uuid);

useControls('fpsgraph', { uuid });

// Background is the project hue/saturation pushed to near-black; the tint slider is that lightness.
const DEFAULT_TINT = darkMode.value ? 0.002 : 0.008;

const { canvasTint } = useControls(
	'🎨 canvas',
	{
		tint: {
			value: DEFAULT_TINT,
			min: 0,
			max: 0.05,
			step: 0.001,
		},
	},
	{ uuid },
);

const canvasClearColor = computed(() => {
	if (!props.projectColor) return DEFAULT_CLEAR;

	try {
		const hsl = { h: 0, s: 0, l: 0 };
		new Color(props.projectColor).getHSL(hsl);
		return new Color().setHSL(hsl.h, hsl.s, canvasTint?.value ?? DEFAULT_TINT).getStyle();
	} catch {
		return DEFAULT_CLEAR;
	}
});

// TSL node materials require the WebGPU renderer (falls back to WebGL2 internally).
function createRenderer({ canvas }: TresRendererSetupContext) {
	return new WebGPURenderer({ canvas: toValue(canvas), antialias: true });
}
</script>

<template>
	<TresLeches :uuid />
	<TresCanvas :renderer="createRenderer" :clear-color="canvasClearColor" :dpr="[1, 2]" class="public-shader-background">
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
