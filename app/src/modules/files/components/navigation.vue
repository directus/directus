<template>
	<v-list nav>
		<template v-if="loading && (nestedFolders === null || nestedFolders.length === 0)">
			<v-list-item v-for="n in 4" :key="n">
				<v-skeleton-loader type="list-item-icon" />
			</v-list-item>
		</template>

		<div class="folders">
			<v-item-group v-model="openFolders" scope="files-navigation" multiple>
				<v-list-group
					to="/files"
					:active="currentFolder === null"
					value="root"
					scope="files-navigation"
					exact
					disable-groupable-parent
					:arrow-placement="nestedFolders && nestedFolders.length > 0 ? 'after' : false"
				>
					<template #activator>
						<v-list-item-icon>
							<v-icon name="folder_special" outline />
						</v-list-item-icon>
						<v-list-item-content>
							<v-text-overflow :text="t('file_library')" />
						</v-list-item-content>
					</template>

					<navigation-folder
						v-for="folder in nestedFolders"
						:key="folder.id"
						:folder="folder"
						:current-folder="currentFolder"
					/>
				</v-list-group>
			</v-item-group>
		</div>

		<v-divider />

		<v-list-item to="/files/all">
			<v-list-item-icon><v-icon name="file_copy" outline /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="t('all_files')" />
			</v-list-item-content>
		</v-list-item>

		<v-list-item to="/files/mine">
			<v-list-item-icon><v-icon name="folder_shared" /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="t('my_files')" />
			</v-list-item-content>
		</v-list-item>

		<v-list-item to="/files/recent">
			<v-list-item-icon><v-icon name="history" /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="t('recent_files')" />
			</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, watch } from 'vue';
import { useFolders, Folder } from '@/composables/use-folders';
import NavigationFolder from './navigation-folder.vue';
import { isEqual } from 'lodash';

export default defineComponent({
	components: { NavigationFolder },
	props: {
		currentFolder: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const { t } = useI18n();

		const { nestedFolders, folders, error, loading, openFolders } = useFolders();

		setOpenFolders();

		watch(() => props.currentFolder, setOpenFolders);

		return { t, folders, nestedFolders, error, loading, openFolders };

		function setOpenFolders() {
			if (!folders.value) return [];
			if (!openFolders?.value) return [];

			const shouldBeOpen: string[] = [];
			const folder = folders.value.find((folder: Folder) => folder.id === props.currentFolder);

			if (folder && folder.parent) parseFolder(folder.parent);

			const newOpenFolders = [...openFolders.value];

			for (const folderID of shouldBeOpen) {
				if (newOpenFolders.includes(folderID) === false) {
					newOpenFolders.push(folderID);
				}
			}

			if (newOpenFolders.length !== 1 && isEqual(newOpenFolders, openFolders.value) === false) {
				openFolders.value = newOpenFolders;
			}

			function parseFolder(id: string) {
				if (!folders.value) return;
				shouldBeOpen.push(id);

				const folder = folders.value.find((folder: Folder) => folder.id === id);

				if (folder && folder.parent) {
					parseFolder(folder.parent);
				}
			}
		}
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

	:deep(.v-list-item-content) {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
}
</style>
