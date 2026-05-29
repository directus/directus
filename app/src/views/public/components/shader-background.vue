<script setup lang="ts">
import { TresCanvas } from '@tresjs/core';
import { Color } from 'three';
import { computed } from 'vue';
import ShaderExperience from './shader-experience.vue';
import { useThemeConfiguration } from '@/composables/use-theme-configuration';

interface Props {
	projectColor?: string | null;
}

const props = defineProps<Props>();

const { darkMode } = useThemeConfiguration();

const DEFAULT_CLEAR = '#6644ff';

const clearColor = computed(() => {
	if (!props.projectColor) return DEFAULT_CLEAR;

	try {
		const hsl = { h: 0, s: 0, l: 0 };
		new Color(props.projectColor).getHSL(hsl);
		return new Color().setHSL(hsl.h, hsl.s, darkMode.value ? 0.002 : 0.008).getStyle();
	} catch {
		return DEFAULT_CLEAR;
	}
});
</script>

<template>
	<TresCanvas :clear-color="clearColor" :dpr="[1, 2]" class="public-shader-background">
		<TresPerspectiveCamera :position="[0, 0, 10]" :look-at="[0, 0, 0]" />
		<!-- Shader scene goes here -->
		<ShaderExperience :project-color="projectColor" />
	</TresCanvas>
</template>

<style lang="scss" scoped>
.public-shader-background {
	position: absolute;
	inset: 0;
	z-index: -1;
}
</style>
