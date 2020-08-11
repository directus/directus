<template>
	<v-list-item
		v-if="folder.children.length === 0"
		@click="clickHandler(folder.id)"
		:active="currentFolder === folder.id"
		:disabled="disabled"
	>
		<v-list-item-icon><v-icon :name="currentFolder === folder.id ? 'folder_open' : 'folder'" /></v-list-item-icon>
		<v-list-item-content>{{ folder.name }}</v-list-item-content>
	</v-list-item>
	<v-list-group v-else @click="clickHandler(folder.id)" :active="currentFolder === folder.id" :disabled="disabled">
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
			:disabled="disabledFolders.includes(childFolder.id)"
			:disabled-folders="disabledFolders"
		/>
	</v-list-group>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';

type Folder = {
	id: string;
	name: string;
	children: Folder[];
};

export default defineComponent({
	name: 'folder-picker-list-item',
	props: {
		folder: {
			type: Object as PropType<Folder>,
			required: true,
		},
		currentFolder: {
			type: String,
			default: null,
		},
		clickHandler: {
			type: Function,
			default: () => undefined,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		disabledFolders: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
	},
});
</script>
