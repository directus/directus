<script setup lang="ts">
import { TresCanvas, type TresRendererSetupContext } from '@tresjs/core';
import { TresLeches, useControls } from '@tresjs/leches';
import { Color } from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { provide, ref, toValue, watch } from 'vue';
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

// Default background is the project hue/saturation pushed to near-black (lightness is dark-mode aware);
// the hex control then lets us test any background color directly, like the particles color.
function resolveCanvasColor(): string {
	if (!props.projectColor) return DEFAULT_CLEAR;

	try {
		const hsl = { h: 0, s: 0, l: 0 };
		new Color(props.projectColor).getHSL(hsl);
		const lightness = darkMode.value ? 0.002 : 0.008;
		return new Color().setHSL(hsl.h, hsl.s, lightness).getStyle();
	} catch {
		return DEFAULT_CLEAR;
	}
}

const canvasClearColor = ref(resolveCanvasColor());

const { canvasColor } = useControls(
	'🎨 canvas',
	{
		color: {
			value: new Color(resolveCanvasColor()),
			type: 'color',
		},
	},
	{ uuid },
);

// The control mutates its Color in place, so deep-watch and re-serialize to a CSS string for the renderer.
watch(
	() => canvasColor?.value,
	(value) => {
		if (value) canvasClearColor.value = new Color(value).getStyle();
	},
	{ deep: true },
);

// When the project color changes, reset the control to the freshly derived default (deep watch propagates it).
watch(
	() => props.projectColor,
	() => {
		if (canvasColor) canvasColor.value.set(resolveCanvasColor());
	},
);

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
