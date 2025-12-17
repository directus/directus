<script setup lang="ts">
import VDivider from '@/components/v-divider.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VItemGroup from '@/components/v-item-group.vue';
import VListGroup from '@/components/v-list-group.vue';
import VListItemContent from '@/components/v-list-item-content.vue';
import VListItemIcon from '@/components/v-list-item-icon.vue';
import VListItem from '@/components/v-list-item.vue';
import VList from '@/components/v-list.vue';
import VSkeletonLoader from '@/components/v-skeleton-loader.vue';
import VTextOverflow from '@/components/v-text-overflow.vue';
import { useFolders } from '@/composables/use-folders';
import { FolderTarget, SpecialFolder } from '@/types/folders';
import { isEqual } from 'lodash';
import { computed, toRefs, watch } from 'vue';
import { useRouter } from 'vue-router';
import NavigationFolder from './files-navigation-folder.vue';

const router = useRouter();

const props = defineProps<{
	rootFolder?: string;
	currentFolder?: string;
	currentSpecial?: SpecialFolder;
	customTargetHandler?: (target: FolderTarget) => void;
	localOpenFolders?: boolean;
	actionsDisabled?: boolean;
}>();

const { rootFolder, localOpenFolders } = toRefs(props);

const { nestedFolders, folders, loading, openFolders } = useFolders(rootFolder, localOpenFolders);

watch([() => props.currentFolder, loading], setOpenFolders, { immediate: true });

const rootFolderInfo = computed(() => {
	if (!folders.value || !rootFolder?.value) return;

	return folders.value.find((folder) => folder.id === rootFolder.value);
});

function onClick(target: FolderTarget) {
	if (props.customTargetHandler) {
		props.customTargetHandler(target);
	} else {
		const path = ['files'];
		if (target.folder) path.push('folders', target.folder);

		if (target.special) {
			path.push(target.special);
		}

		router.push(`/${path.join('/')}`);
	}
}

function setOpenFolders() {
	if (!folders.value) return;
	if (!openFolders?.value) return;

	const shouldBeOpen: string[] = [];
	const folder = folders.value.find((folder) => folder.id === props.currentFolder);

	if (folder?.parent) parseFolder(folder.parent);

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

		const folder = folders.value.find((folder) => folder.id === id);

		if (folder && folder.parent) {
			parseFolder(folder.parent);
		}
	}
}
</script>

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
					clickable
					:active="(!currentFolder && !currentSpecial) || (currentFolder !== undefined && currentFolder === rootFolder)"
					:value="rootFolder ?? 'root'"
					scope="files-navigation"
					exact
					disable-groupable-parent
					:arrow-placement="nestedFolders && nestedFolders.length > 0 ? 'after' : false"
					@click="onClick(rootFolder ? { folder: rootFolder } : {})"
				>
					<template #activator>
						<v-list-item-icon>
							<v-icon name="folder_special" outline />
						</v-list-item-icon>
						<v-list-item-content>
							<v-text-overflow v-if="rootFolderInfo" :text="rootFolderInfo.name" />
							<v-text-overflow v-else :text="$t('file_library')" />
						</v-list-item-content>
					</template>

					<navigation-folder
						v-for="folder in nestedFolders"
						:key="folder.id"
						:click-handler="onClick"
						:folder="folder"
						:current-folder="currentFolder"
						:actions-disabled="actionsDisabled"
					/>
				</v-list-group>
			</v-item-group>
		</div>

		<v-divider />

		<v-list-item clickable :active="currentSpecial === 'all'" @click="onClick({ special: 'all' })">
			<v-list-item-icon><v-icon name="file_copy" outline /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="$t('all_files')" />
			</v-list-item-content>
		</v-list-item>

		<v-list-item clickable :active="currentSpecial === 'mine'" @click="onClick({ special: 'mine' })">
			<v-list-item-icon><v-icon name="folder_shared" /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="$t('my_files')" />
			</v-list-item-content>
		</v-list-item>

		<v-list-item clickable :active="currentSpecial === 'recent'" @click="onClick({ special: 'recent' })">
			<v-list-item-icon><v-icon name="history" /></v-list-item-icon>
			<v-list-item-content>
				<v-text-overflow :text="$t('recent_files')" />
			</v-list-item-content>
		</v-list-item>
	</v-list>
</template>

<style lang="scss" scoped>
.v-skeleton-loader {
	--v-skeleton-loader-background-color: var(--theme--background-accent);
}

.folders {
	inline-size: 100%;
	overflow-x: hidden;

	:deep(.v-list-item-content) {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
}
</style>
