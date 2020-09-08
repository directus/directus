<template>
	<v-dialog v-model="dialogActive">
		<template #activator="{ on }">
			<v-button rounded icon class="add-new" @click="on" v-tooltip.bottom="$t('create_folder')">
				<v-icon name="create_new_folder" outline />
			</v-button>
		</template>

		<v-card>
			<v-card-title>{{ $t('create_folder') }}</v-card-title>
			<v-card-text>
				<v-input autofocus @keyup.enter="addFolder" :placeholder="$t('folder_name')" v-model="newFolderName" />
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="dialogActive = false">{{ $t('cancel') }}</v-button>
				<v-button :disabled="!newFolderName || newFolderName.length === 0" @click="addFolder" :loading="saving">
					{{ $t('save') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import useFolders from '../composables/use-folders';
import api from '@/api';
import router from '@/router';

export default defineComponent({
	props: {
		parent: {
			type: String,
			default: null,
		},
	},
	setup(props) {
		const dialogActive = ref(false);
		const saving = ref(false);
		const newFolderName = ref(null);
		const savingError = ref(null);

		const { fetchFolders } = useFolders();

		return { addFolder, dialogActive, newFolderName, saving, savingError };

		async function addFolder() {
			saving.value = true;

			try {
				const newFolder = await api.post(`/folders`, {
					name: newFolderName.value,
					parent_folder: props.parent === 'root' ? null : props.parent,
				});

				await fetchFolders();

				dialogActive.value = false;
				newFolderName.value = null;

				router.push({ path: '/files', query: { folder: newFolder.data.data.id } });
			} catch (err) {
				savingError.value = err;
			} finally {
				saving.value = false;
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.add-new {
	--v-button-background-color: var(--primary-25);
	--v-button-color: var(--primary);
	--v-button-background-color-hover: var(--primary-50);
	--v-button-color-hover: var(--primary);
}
</style>
