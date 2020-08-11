<template>
	<v-list nav>
		<v-list-item to="/files/" exact>
			<v-list-item-icon><v-icon name="folder_special" /></v-list-item-icon>
			<v-list-item-content>{{ $t('all_files') }}</v-list-item-content>
		</v-list-item>

		<v-divider v-if="loading || nestedFolders.length > 0" />

		<template v-if="loading && (nestedFolders === null || nestedFolders.length === 0)">
			<v-list-item v-for="n in 4" :key="n">
				<v-skeleton-loader type="list-item-icon" />
			</v-list-item>
		</template>

		<div class="folders">
			<navigation-folder
				v-for="folder in nestedFolders"
				:key="folder.id"
				:folder="folder"
				:current-folder="currentFolder"
				:start-open-folders="startOpenFolders"
			/>
		</div>
	</v-list>
</template>

<script lang="ts">
import { defineComponent, computed } from '@vue/composition-api';
import useFolders from '../../composables/use-folders';
import NavigationFolder from './navigation-folder.vue';

export default defineComponent({
	components: { NavigationFolder },
	model: {
		prop: 'currentFolder',
		event: 'filter',
	},
	props: {
		currentFolder: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { nestedFolders, folders, error, loading } = useFolders();

		const startOpenFolders = computed(() => {
			if (!folders.value) return [];

			const openFolders: string[] = [];
			const folder = folders.value.find((folder) => folder.id === props.currentFolder);

			if (folder && folder.parent_folder) parseFolder(folder.parent_folder);

			return openFolders;

			function parseFolder(id: string) {
				if (!folders.value) return;
				openFolders.push(id);

				const folder = folders.value.find((folder) => folder.id === id);

				if (folder && folder.parent_folder) {
					parseFolder(folder.parent_folder);
				}
			}
		});

		return { folders, nestedFolders, error, loading, startOpenFolders };
	},
});
</script>

<style lang="scss" scoped>
.v-skeleton-loader {
	--v-skeleton-loader-background-color: var(--background-normal-alt);
}

.folders {
	width: 100%;
	overflow-x: hidden;

	::v-deep .v-list-item-content {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
}
</style>
