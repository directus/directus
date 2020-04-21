<template>
	<v-list-item
		v-if="folder.children === undefined"
		@click="clickHandler(folder.id)"
		:active="currentFolder === folder.id"
	>
		<v-list-item-icon><v-icon name="folder" /></v-list-item-icon>
		<v-list-item-content>{{ folder.name }}</v-list-item-content>
	</v-list-item>
	<v-list-group v-else @click="clickHandler(folder.id)" :active="currentFolder === folder.id">
		<template #activator="{ active }">
			<v-list-item-icon>
				<v-icon :name="active ? 'folder_open' : 'folder'" />
			</v-list-item-icon>
			<v-list-item-content>{{ folder.name }}</v-list-item-content>
		</template>
		<navigation-folder
			v-for="childFolder in folder.children"
			:key="childFolder.id"
			:folder="childFolder"
			:current-folder="currentFolder"
			:click-handler="clickHandler"
		/>
	</v-list-group>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@vue/composition-api';
import { Folder } from '../../compositions/use-folders';

export default defineComponent({
	name: 'navigation-folder',
	props: {
		folder: {
			type: Object as PropType<Folder>,
			required: true,
		},
		currentFolder: {
			type: Number,
			default: null,
		},
		clickHandler: {
			type: Function,
			default: () => undefined,
		},
	},
});
</script>
