<template>
	<v-list-item
		v-if="!folder.children || folder.children.length === 0"
		:active="currentFolder === folder.id"
		:disabled="disabled"
		clickable
		@click="$emit('click', folder.id)"
	>
		<v-list-item-icon>
			<v-icon :name="currentFolder === folder.id ? 'folder_open' : 'folder'" />
		</v-list-item-icon>
		<v-list-item-content>{{ folder.name }}</v-list-item-content>
	</v-list-item>
	<v-list-group
		v-else
		clickable
		:active="currentFolder === folder.id"
		:disabled="disabled"
		@click="$emit('click', folder.id)"
	>
		<template #activator>
			<v-list-item-icon>
				<v-icon :name="currentFolder === folder.id ? 'folder_open' : 'folder'" />
			</v-list-item-icon>
			<v-list-item-content>{{ folder.name }}</v-list-item-content>
		</template>
		<folder-list-item
			v-for="childFolder in folder.children"
			:key="childFolder.id!"
			:folder="childFolder"
			:current-folder="currentFolder"
			:disabled="disabledFolders.includes(childFolder.id!)"
			:disabled-folders="disabledFolders"
			@click="$emit('click', $event)"
		/>
	</v-list-group>
</template>

<script setup lang="ts">
import type { Folder } from '@/composables/use-folders';

withDefaults(
	defineProps<{
		folder: Folder;
		currentFolder: string | null;
		disabled?: boolean;
		disabledFolders?: string[];
	}>(),
	{ disabledFolders: () => [] }
);

defineEmits<{
	(e: 'click', folderId: Folder['id']): void;
}>();
</script>
