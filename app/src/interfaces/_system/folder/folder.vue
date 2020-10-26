<template>
	<folder-picker :value="currentFolder" :disabled-folders="disabledFolders" @input="onFolderSelect" />
</template>

<script lang="ts">
import { defineComponent, PropType, ref } from '@vue/composition-api';
import FolderPicker from '@/modules/files/components/folder-picker.vue';

export default defineComponent({
	components: { FolderPicker },
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
	},
	setup(props, { emit }) {
		const currentFolder = ref<string | null>(props.value);

		return {
			currentFolder,
			onFolderSelect,
		};

		function onFolderSelect(folderId: string | null) {
			if (props.disabled) {
				return;
			}
			currentFolder.value = folderId;
			emit('input', folderId);
		}
	},
});
</script>
