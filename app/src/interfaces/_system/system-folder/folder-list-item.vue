<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VListGroup from '@/components/v-list-group.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import type { Folder } from '@/composables/use-folders';

defineProps<{
	folder: Folder;
	currentFolder: string | null;
	disabled?: boolean;
	disabledFolders?: string[];
}>();

defineEmits<{
	(e: 'click', folderId: Folder['id']): void;
}>();
</script>

<template>
	<VListItem
		v-if="!folder.children || folder.children.length === 0"
		:active="currentFolder === folder.id"
		:disabled="disabled"
		clickable
		@click="$emit('click', folder.id)"
	>
		<VListItemIcon>
			<VIcon :name="currentFolder === folder.id ? 'folder_open' : 'folder'" />
		</VListItemIcon>
		<VListItemContent>{{ folder.name }}</VListItemContent>
	</VListItem>
	<VListGroup
		v-else
		clickable
		:active="currentFolder === folder.id"
		:disabled="disabled"
		@click="$emit('click', folder.id)"
	>
		<template #activator>
			<VListItemIcon>
				<VIcon :name="currentFolder === folder.id ? 'folder_open' : 'folder'" />
			</VListItemIcon>
			<VListItemContent>{{ folder.name }}</VListItemContent>
		</template>
		<folder-list-item
			v-for="childFolder in folder.children"
			:key="childFolder.id!"
			:folder="childFolder"
			:current-folder="currentFolder"
			:disabled="disabledFolders?.includes(childFolder.id!)"
			:disabled-folders="disabledFolders"
			@click="$emit('click', $event)"
		/>
	</VListGroup>
</template>
