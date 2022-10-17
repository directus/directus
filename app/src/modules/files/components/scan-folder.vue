<template>
	<v-dialog v-model="dialogActive" @esc="dialogActive = false">
		<template #activator="{ on }">
			<v-button v-tooltip.bottom="t('check_files_integrity')" rounded icon secondary @click="on">
				<v-icon name="sync_problem" outline />
			</v-button>
		</template>

		<v-card>
			<v-card-title>{{ t('delete_are_you_sure') }}</v-card-title>
			<v-card-actions>
				<v-button secondary @click="dialogActive = false">{{ t('cancel') }}</v-button>
				<v-button :loading="checking" @click="checkFilesIntegrity">
					{{ t('check') }}
				</v-button>
			</v-card-actions>
		</v-card>
	</v-dialog>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, ref } from 'vue';
import { useFolders } from '@/composables/use-folders';
import api from '@/api';
import { unexpectedError } from '@/utils/unexpected-error';

export default defineComponent({
	setup() {
		const { t } = useI18n();

		const dialogActive = ref(false);
		const checking = ref(false);

		const { fetchFolders } = useFolders();

		return { t, checkFilesIntegrity, dialogActive, checking };

		async function checkFilesIntegrity() {
			checking.value = true;

			try {
				await api.get(`/files/scan`);

				await fetchFolders();

				dialogActive.value = false;
			} catch (err: any) {
				unexpectedError(err);
			} finally {
				checking.value = false;
			}
		}
	},
});
</script>
