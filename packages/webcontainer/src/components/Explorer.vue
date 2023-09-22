<template>
	<div class="explorer">
		<div class="path">
			{{ filePath }}
		</div>
		<div class="files">
			<div v-if="filePath !== '/'" class="file" @click="up()">..</div>
			<div v-for="file in files" :key="file.name" class="file" @click="onClick(file)">
				{{ file.name }}
			</div>
		</div>
		<div v-if="fileContents" class="file-preview">
			<div>
				<pre>{{ fileContents }}</pre>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { DirEnt, WebContainer } from '@webcontainer/api';
import { ref, watch } from 'vue';

const props = defineProps<{
	webcontainer: WebContainer | null;
}>();

const filePath = ref<string>('/');

const files = ref<DirEnt<string>[]>([]);
const fileContents = ref<string | null>(null);

watch(
	[() => props.webcontainer, () => filePath.value],
	async () => {
		if (!props.webcontainer) return;

		files.value = await props.webcontainer.fs.readdir(filePath.value, {
			withFileTypes: true,
		});
	},
	{ immediate: true }
);

function up() {
	const path = filePath.value.split('/');
	if (filePath.value.endsWith('/')) path.pop();
	path.pop();

	filePath.value = path.join('/') + '/';
}

async function onClick(file: DirEnt<string>) {
	if (!props.webcontainer) return;

	if (file.isDirectory()) {
		filePath.value = `${filePath.value}${file.name}/`;
	} else {
		fileContents.value = await props.webcontainer.fs.readFile(`${filePath.value}${file.name}`, 'utf-8');
	}
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
