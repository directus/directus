<script setup lang="ts">
import VIcon from '@/components/v-icon/v-icon.vue';
import VListGroup from '@/components/v-list-group.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';

type Folder = {
	id: string;
	name: string;
	children: Folder[];
};

defineProps<{
	folder: Folder;
	currentFolder: string | null;
	clickHandler?: (folderId: string) => void;
	disabled?: boolean;
	disabledFolders?: string[];
}>();
</script>

<template>
	<div class="folder-picker-list-item">
		<VListItem
			v-if="folder.children.length === 0"
			clickable
			:active="currentFolder === folder.id"
			:disabled="disabled"
			@click="clickHandler?.(folder.id)"
		>
			<VListItemIcon><VIcon :name="currentFolder === folder.id ? 'folder_open' : 'folder'" /></VListItemIcon>
			<VListItemContent>{{ folder.name }}</VListItemContent>
		</VListItem>
		<VListGroup
			v-else
			clickable
			:active="currentFolder === folder.id"
			:disabled="disabled"
			@click="clickHandler?.(folder.id)"
		>
			<template #activator>
				<VListItemIcon>
					<VIcon :name="currentFolder === folder.id ? 'folder_open' : 'folder'" />
				</VListItemIcon>
				<VListItemContent>{{ folder.name }}</VListItemContent>
			</template>
			<FolderPickerListItem
				v-for="childFolder in folder.children"
				:key="childFolder.id"
				:folder="childFolder"
				:current-folder="currentFolder"
				:click-handler="clickHandler"
				:disabled="disabledFolders?.includes(childFolder.id)"
				:disabled-folders="disabledFolders"
			/>
		</VListGroup>
	</div>
</template>
