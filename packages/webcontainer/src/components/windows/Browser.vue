<template>
	<div class="browser">
		<div class="header">
			<input v-model="url" />
		</div>
		<iframe :src="url" frameborder="0" class="browser"></iframe>
	</div>
</template>

<script setup lang="ts">
import { WebContainer } from '@webcontainer/api';
import { ref } from 'vue';

const props = withDefaults(
	defineProps<{
		initialUrl: string;
		webcontainer: WebContainer | null;
	}>(),
	{
		initialUrl: 'https://google.com',
	}
);

const url = ref(props.initialUrl);
</script>

<style scoped lang="scss">
.browser {
	width: 100%;
	height: 100%;

	.header {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 30px;
		background: var(--background-subdued);

		input {
			width: 100%;
			height: 100%;
			border: none;
			background: transparent;
			color: var(--foreground-normal);
			font-size: 14px;
			padding: 0 10px;
		}
	}
}
</style>
