<template>
	<div class="files">
		<div v-for="file in files" :key="file.name" class="file" @click.stop="onClick(file)">
			<div class="name">
				<input v-if="file.folder && !flat" v-model="file.open" type="checkbox" />
				{{ file.name }}
			</div>
			<div v-if="file.folder && file.open" class="sub">
				<Files :webcontainer="webcontainer" :root="file.path + '/'" @file="emit('file', $event)" />
			</div>
		</div>
	</div>
</template>

<script lang="ts">
export default {
	name: 'Files',
};
</script>

<script setup lang="ts">
import { WebContainer } from '@webcontainer/api';
import { ref, watch } from 'vue';

interface File {
	name: string;
	folder: boolean;
	path: string;
	open: boolean;
}

const props = withDefaults(
	defineProps<{
		root?: string;
		flat?: boolean;
		webcontainer: WebContainer;
	}>(),
	{
		root: '/',
		flat: false,
	}
);

const emit = defineEmits<{
	(event: 'file', path: string): void;
	(event: 'folder', path: string): void;
	(event: 'update:root', path: string): void;
}>();

const files = ref<File[]>([]);

watch([() => props.webcontainer], updateFiles, { immediate: true });

watch([() => props.root], () => {
	if (!props.flat) return;

	updateFiles();
});

async function updateFiles() {
	if (!props.webcontainer) return;

	console.log('update files', props.root);

	files.value = (
		await props.webcontainer.fs.readdir(props.root, {
			withFileTypes: true,
		})
	).map((file) => ({
		name: file.name,
		folder: file.isDirectory(),
		path: props.root + file.name,
		open: false,
	}));

	if (props.root !== '/') {
		files.value.unshift({
			name: '..',
			folder: true,
			path: props.root + '..',
			open: false,
		});
	}
}

function onClick(file: File) {
	if (file.folder) {
		emit('folder', file.path);

		if (props.flat) {
			if (file.name === '..') {
				up();
			} else {
				emit('update:root', file.path + '/');
			}
		} else {
			file.open = !file.open;
		}
	} else {
		emit('file', file.path);
	}
}

function up() {
	const path = props.root.split('/');
	if (props.root.endsWith('/')) path.pop();
	path.pop();

	emit('update:root', path.join('/') + '/');
}
</script>

<style scoped lang="scss">
.files {
	display: flex;
	flex-direction: column;
	padding: 8px 12px;
	gap: 2px;

	.file {
		cursor: pointer;

		.name:hover {
			background: var(--background-normal-alt);
			border-radius: var(--border-radius);
		}
	}

	:deep(.sub .files) {
		padding: 4px 12px;
	}
}
</style>
