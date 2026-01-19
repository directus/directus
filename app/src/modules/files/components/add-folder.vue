<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VIcon from '@/components/v-icon/v-icon.vue';
import VInput from '@/components/v-input.vue';
import { useFolders } from '@/composables/use-folders';
import { unexpectedError } from '@/utils/unexpected-error';

const props = defineProps<{
	parent?: string;
	disabled?: boolean;
}>();

const router = useRouter();

const dialogActive = ref(false);
const saving = ref(false);
const newFolderName = ref(null);

const { fetchFolders } = useFolders();

async function addFolder() {
	if (newFolderName.value === null || saving.value) return;

	saving.value = true;

	try {
		const newFolder = await api.post(`/folders`, {
			name: newFolderName.value,
			parent: props.parent === 'root' ? null : props.parent,
		});

		await fetchFolders();

		dialogActive.value = false;
		newFolderName.value = null;

		router.push({ path: `/files/folders/${newFolder.data.data.id}` });
	} catch (error) {
		unexpectedError(error);
	} finally {
		saving.value = false;
	}
}
</script>

<template>
	<VDialog v-model="dialogActive" @esc="dialogActive = false" @apply="addFolder">
		<template #activator="{ on }">
			<VButton
				v-tooltip.bottom="disabled ? $t('not_allowed') : $t('create_folder')"
				rounded
				icon
				small
				secondary
				:disabled="disabled"
				@click="on"
			>
				<VIcon small name="create_new_folder" outline />
			</VButton>
		</template>

		<VCard>
			<VCardTitle>{{ $t('create_folder') }}</VCardTitle>
			<VCardText>
				<VInput v-model="newFolderName" autofocus :placeholder="$t('folder_name')" />
			</VCardText>
			<VCardActions>
				<VButton secondary @click="dialogActive = false">{{ $t('cancel') }}</VButton>
				<VButton ref="saveBtn" :disabled="newFolderName === null" :loading="saving" @click="addFolder">
					{{ $t('save') }}
				</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>
