<template>
	<div class="explorer">
		<div class="header"></div>
		<div class="tabs">
			<div
				v-for="(file, i) in openFiles"
				:key="file.path"
				class="tab"
				:class="{ active: focusedFile === i }"
				@click="focusedFile = i"
			>
				{{ file.path }}
				<div class="close" :class="{ unsaved: !file.saved }" @click="close(i)"></div>
			</div>
		</div>
		<div class="files">
			<v-files :webcontainer="webcontainer" @file="onFile" />
		</div>
		<div v-show="openFiles.length > 0" class="file-preview">
			<codemirror
				:model-value="openFiles[focusedFile]?.contents"
				:autofocus="true"
				:extensions="extensions"
				:indent-with-tab="true"
				:tab-size="4"
				@update:model-value="write(openFiles[focusedFile], $event)"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import { WebContainer } from '@webcontainer/api';
import { ref } from 'vue';
import { Codemirror } from 'vue-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { useShortcut } from '../../composables/use-shortcut';

interface File {
	path: string;
	contents: string;
	saved: boolean;
}

const props = defineProps<{
	webcontainer: WebContainer | null;
}>();

const extensions = [javascript()];

const focusedFile = ref<number>(0);
const openFiles = ref<File[]>([]);

useShortcut('meta+s', () => {
	if (!openFiles.value[focusedFile.value]) return;
	save(openFiles.value[focusedFile.value]);
});

function write(file: File, contents: string) {
	file.contents = contents;
	file.saved = false;
}

async function save(file: File) {
	if (!props.webcontainer) return;

	await props.webcontainer.fs.writeFile(file.path, file.contents, 'utf-8');
	file.saved = true;
}

function close(index: number) {
	if (!openFiles.value[index].saved) {
		if (!confirm('You have unsaved changes. Are you sure you want to close this file?')) return;
	}

	openFiles.value.splice(index, 1);
	focusedFile.value = Math.max(0, focusedFile.value - 1);
}

async function onFile(path: string) {
	if (!props.webcontainer) return;

	const existing = openFiles.value.findIndex((f) => f.path === path);

	if (existing !== -1) {
		focusedFile.value = existing;
		return;
	}

	const contents = await props.webcontainer.fs.readFile(path, 'utf-8');

	openFiles.value.push({
		path: path,
		saved: true,
		contents,
	});

	focusedFile.value = openFiles.value.length - 1;
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

	.header {
		grid-column: 1 / 2;
		display: flex;
		align-items: center;
		padding: 0 10px;
		background: var(--background-normal-alt);
	}

	.tabs {
		grid-column: 2 / 3;
		display: flex;
		align-items: stretch;
		overflow-x: auto;

		background: var(--background-normal-alt);

		.tab {
			cursor: pointer;
			padding: 4px 8px;
			transition: background-color 0.1s ease-in-out;
			display: flex;
			align-items: center;
			justify-content: center;
			gap: 8px;
			white-space: nowrap;

			&:hover {
				background-color: var(--background-normal);
			}

			&.active {
				background-color: var(--background-subdued);
			}

			.close {
				width: 8px;
				height: 8px;
				border-radius: 50%;
				background-color: var(--foreground-subdued);
				margin-left: 4px;
				transition: background-color 0.1s ease-in-out;

				&:hover {
					background-color: var(--primary-50);
				}

				&.unsaved {
					background-color: var(--primary);
				}
			}
		}
	}

	.files {
		overflow: auto;
		background-color: var(--background-normal);
	}

	.file-preview {
		background-color: var(--background-page);
		overflow: auto;
		height: 100%;

		:deep(.v-codemirror .cm-editor) {
			height: 100%;
		}
	}
}
</style>
