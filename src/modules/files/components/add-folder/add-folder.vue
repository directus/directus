<template>
	<v-dialog v-model="dialogActive">
		<template #activator="{ on }">
			<v-button rounded icon class="add-new" @click="on">
				<v-icon name="create_new_folder" />
			</v-button>
		</template>

		<v-card>
			<v-card-title>{{ $t('add_new_folder') }}</v-card-title>
			<v-card-text>
				<v-input :placeholder="$t('folder_name')" v-model="newFolderName" />
			</v-card-text>
			<v-card-actions>
				<v-button secondary @click="dialogActive = false">{{ $t('cancel') }}</v-button>
				<v-button
					:disabled="!newFolderName || newFolderName.length === 0"
					@click="addFolder"
					:loading="saving"
				>
					{{ $t('save') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import { defineComponent, ref } from '@vue/composition-api';
import useFolders from '../../compositions/use-folders';
import api from '@/api';
import useProjectsStore from '@/stores/projects';

export default defineComponent({
	props: {
		parent: {
			type: Number,
			default: null,
		},
	},
	setup(props) {
		const projectsStore = useProjectsStore();
		const dialogActive = ref(false);
		const saving = ref(false);
		const newFolderName = ref(null);
		const savingError = ref(null);

		const { fetchFolders } = useFolders();

		return { addFolder, dialogActive, newFolderName, saving, savingError };

		async function addFolder() {
			const { currentProjectKey } = projectsStore.state;

			saving.value = true;

			try {
				await api.post(`/${currentProjectKey}/folders`, {
					name: newFolderName.value,
					parent_folder: props.parent,
				});

				await fetchFolders();

				dialogActive.value = false;
				newFolderName.value = null;
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
