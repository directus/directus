<template>
	<v-skeleton-loader v-if="loading" />
	<v-menu
		v-else
		class="v-select"
		:attached="true"
		:show-arrow="false"
		:disabled="disabled"
		:close-on-content-click="true"
	>
		<template #activator="{ toggle, active }">
			<v-input
				readonly
				:active="active"
				:model-value="folderPath"
				:placeholder="placeholder"
				:disabled="disabled"
				@click="toggle"
			>
				<template #prepend><v-icon :name="!value ? 'folder_special' : 'folder_open'" /></template>
				<template #append><v-icon name="expand_more" :class="{ active }" /></template>
			</v-input>
		</template>
		<v-list>
			<v-list-item clickable :active="!value" @click="emitValue(null)">
				<v-list-item-icon>
					<v-icon name="folder_special" />
				</v-list-item-icon>
				<v-list-item-content>{{ t('interfaces.system-folder.root_name') }}</v-list-item-content>
			</v-list-item>
			<v-divider v-if="nestedFolders && nestedFolders.length > 0" />
			<folder-list-item
				v-for="folder in nestedFolders"
				:key="folder.id!"
				clickable
				:folder="folder"
				:current-folder="value"
				:disabled="disabledFolders.includes(folder.id!)"
				:disabled-folders="disabledFolders"
				@click="emitValue"
			/>
		</v-list>
	</v-menu>
</template>

<script setup lang="ts">
import { Folder, useFolders } from '@/composables/use-folders';
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import FolderListItem from './folder-list-item.vue';

const props = withDefaults(
	defineProps<{
		value: string | null;
		disabledFolders: string[];
		disabled?: boolean;
		placeholder?: string;
	}>(),
	{
		disabledFolders: () => [],
	}
);

const emit = defineEmits<{
	(e: 'input', value: string | null): void;
}>();

const { t } = useI18n();

const { nestedFolders, folders, loading } = useFolders();

const folderPath = computed(() => {
	if (!props.value || !folders.value) {
		return t('interfaces.system-folder.root_name');
	}

	const folder = folders.value.find((folder) => folder.id === props.value);
	return folder
		? folderParentPath(folder as Folder, folders.value)
				.map((folder) => folder.name)
				.join(' / ')
		: props.value;
});

function emitValue(id: string | null) {
	return emit('input', id);
}

function folderParentPath(folder: Folder, folders: Folder[]) {
	const folderMap = new Map(folders.map((folder) => [folder.id, folder]));

	const folderParent = (target: Folder): Folder[] =>
		(folderMap.has(target.parent) ? folderParent(folderMap.get(target.parent) as Folder) : []).concat(target);

	return folderParent(folder);
}
</script>

<style lang="scss" scoped>
.v-input {
	cursor: pointer;

	.v-icon {
		transition: transform var(--medium) var(--transition-out);

		&.active {
			transform: scaleY(-1);
			transition-timing-function: var(--transition-in);
		}
	}

	:deep(input) {
		cursor: pointer;
	}
}
</style>
