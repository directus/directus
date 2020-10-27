<template>
	<v-skeleton-loader v-if="loading" />
	<v-menu
		v-else
		class="v-select"
		:attached="true"
		:showArrow="false"
		:disabled="disabled"
		:close-on-content-click="true"
	>
		<template #activator="{ toggle, active }">
			<v-input
				readonly
				@click="toggle"
				:active="active"
				:value="folderPath"
				:placeholder="placeholder"
				:disabled="disabled"
			>
				<template #prepend><v-icon :name="!value ? 'folder_special' : 'folder_open'" /></template>
				<template #append><v-icon name="expand_more" :class="{ active }" /></template>
			</v-input>
		</template>
		<v-list>
			<v-list-item @click="() => emitValue(null)" :active="!value">
				<v-list-item-icon>
					<v-icon name="folder_special" />
				</v-list-item-icon>
				<v-list-item-content>{{ $t('interfaces.folder.root_name') }}</v-list-item-content>
			</v-list-item>
			<v-divider />
			<folder-list-item
				v-for="folder in nestedFolders"
				:key="folder.id"
				:folder="folder"
				:current-folder="value"
				:click-handler="emitValue"
				:disabled="disabledFolders.includes(folder.id)"
				:disabled-folders="disabledFolders"
			/>
		</v-list>
	</v-menu>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from '@vue/composition-api';
import FolderListItem from './folder-list-item.vue';
import useFolders, { Folder } from '@/modules/files/composables/use-folders';
import i18n from "@/lang";

export default defineComponent({
	components: { FolderListItem },
	props: {
		value: {
			type: String,
			default: null,
		},
		disabledFolders: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		placeholder: {
			type: String,
			default: '',
		},
	},
	setup(props, { emit }) {
		const toggle = ref<boolean>(false);
		const { nestedFolders, folders, loading } = useFolders();

		const folderPath = computed(() => {
			if (!props.value || !folders.value) {
				return i18n.t('interfaces.folder.root_name');
			}
			const folder = folders.value.find((folder) => folder.id === props.value);
			return folder
				? folderParentPath(folder as Folder, folders.value)
						.map((folder) => folder.name)
						.join(' / ')
				: props.value;
		});

		return {
			emitValue,
			loading,
			toggle,
			folderPath,
			nestedFolders,
			onFolderSelect,
		};

		function emitValue(id: string | null) {
			return emit('input', id);
		}

		function folderParentPath(folder: Folder, folders: Folder[]) {
			const folderMap = new Map(folders.map((folder) => [folder.id, folder]));
			const folderParent = (target: Folder): Folder[] =>
				(folderMap.has(target.parent) ? folderParent(folderMap.get(target.parent) as Folder) : []).concat(
					target
				);
			return folderParent(folder);
		}

		function onFolderSelect(folderId: string | null) {
			if (props.disabled) {
				return;
			}
			emit('input', folderId);
		}
	},
});
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
	::v-deep input {
		cursor: pointer;
	}
}
</style>
