<script setup lang="ts">
import { TresCanvas } from '@tresjs/core';
import ShaderExperience from './shader-experience.vue';
</script>

<template>
	<TresCanvas alpha window-size :dpr="[1, 2]" class="public-shader-background">
		<TresPerspectiveCamera :position="[0, 0, 10]" :look-at="[0, 0, 0]" />
		<!-- Shader scene goes here -->
		<ShaderExperience />
	</TresCanvas>
</template>

<style lang="scss" scoped>
.public-shader-background {
	position: absolute;
	inset: 0;
	z-index: -1;
}
</style>
