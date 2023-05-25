<template>
	<div class="folder-picker-list-item">
		<v-list-item
			v-if="folder.children.length === 0"
			clickable
			:active="currentFolder === folder.id"
			:disabled="disabled"
			@click="clickHandler?.(folder.id)"
		>
			<v-list-item-icon><v-icon :name="currentFolder === folder.id ? 'folder_open' : 'folder'" /></v-list-item-icon>
			<v-list-item-content>{{ folder.name }}</v-list-item-content>
		</v-list-item>
		<v-list-group
			v-else
			clickable
			:active="currentFolder === folder.id"
			:disabled="disabled"
			@click="clickHandler?.(folder.id)"
		>
			<template #activator>
				<v-list-item-icon>
					<v-icon :name="currentFolder === folder.id ? 'folder_open' : 'folder'" />
				</v-list-item-icon>
				<v-list-item-content>{{ folder.name }}</v-list-item-content>
			</template>
			<folder-picker-list-item
				v-for="childFolder in folder.children"
				:key="childFolder.id"
				:folder="childFolder"
				:current-folder="currentFolder"
				:click-handler="clickHandler"
				:disabled="disabledFolders?.includes(childFolder.id)"
				:disabled-folders="disabledFolders"
			/>
		</v-list-group>
	</div>
</template>

<script setup lang="ts">
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
