<template>
	<div class="explorer">
		<div class="path">
			{{ filePath }}
		</div>
		<v-files v-model:root="filePath" :webcontainer="webcontainer" flat @file="onFile" />
		<div v-if="fileContents" class="file-preview">
			<div v-if="fileExtension === 'svg'" v-html="fileContents"></div>
			<img v-else-if="images.includes(fileExtension ?? '')" :src="fileContents" />
			<div v-else>
				<pre>{{ fileContents }}</pre>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { WebContainer } from '@webcontainer/api';
import { ref } from 'vue';

const props = defineProps<{
	webcontainer: WebContainer | null;
}>();

const filePath = ref<string>('/');

const fileExtension = ref<string | null>(null);
const fileContents = ref<string | null>(null);
const images = ['png', 'jpg', 'jpeg', 'gif'];

async function onFile(file: string) {
	if (!props.webcontainer) return;

	fileExtension.value = file.split('.').pop() ?? null;

	if (images.includes(fileExtension.value ?? '')) {
		// convert to base64
		const raw = await props.webcontainer.fs.readFile(file, 'binary');
		// convert utf-8 to base64
		fileContents.value = `data:image/${fileExtension.value};base64,${btoa(raw)}`;

		return;
	}

	fileContents.value = await props.webcontainer.fs.readFile(file, 'utf-8');
}
</script>

<style scoped lang="scss">
.explorer {
	width: 100%;
	height: 100%;
	display: grid;
	grid-template-columns: 200px 1fr;
	grid-template-rows: 40px 1fr;
	overflow: hidden;

	.path {
		grid-column: 1 / 3;
		display: flex;
		align-items: center;
		padding: 0 10px;
		background: var(--background-normal-alt);
	}

	.files {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
		padding: 10px;
		overflow: auto;
		.file {
			cursor: pointer;
			padding: 4px 8px;
			background-color: var(--background-normal-alt);
		}
	}

	.file-preview {
		background-color: var(--background-page);
		padding: 10px;
		overflow: auto;
		height: 100%;

		pre {
			font-family: var(--family-monospace);
			color: var(--foreground-normal);
			margin: 0;
		}
	}
}
</style>
