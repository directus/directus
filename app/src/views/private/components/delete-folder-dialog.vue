<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VRadio from '@/components/v-radio.vue';
import { Folder, FolderType } from '@/composables/use-folders';
import { moveAndDelete, recursiveDelete } from '@/utils/delete-folder';
import { unexpectedError } from '@/utils/unexpected-error';

const modelValue = defineModel<boolean>({ required: true });

const props = defineProps<{
	folders: Folder[];
	allFolders: Folder[];
	type: FolderType;
}>();

const emit = defineEmits<{
	done: [];
}>();

const { t } = useI18n();

type DeleteMode = 'move' | 'delete';

const deleteMode = ref<DeleteMode>('move');
const saving = ref(false);

watch(modelValue, (val) => {
	if (val) deleteMode.value = 'move';
});

// Each folder type words the delete options differently — see the matching blocks in the translations
const TRANSLATION_KEYS: Record<FolderType, string> = {
	assets: 'delete_folder_dialog',
	flows: 'delete_flow_folder_dialog',
};

const translationKey = computed(() => TRANSLATION_KEYS[props.type]);

const radioOptions = computed(() => [
	{ value: 'move', label: t(`${translationKey.value}.move_content`) },
	{ value: 'delete', label: t(`${translationKey.value}.delete_content`) },
]);

async function save() {
	if (saving.value) return;
	saving.value = true;

	try {
		if (deleteMode.value === 'move') {
			await moveAndDelete(props.folders, props.type);
		} else {
			await recursiveDelete(props.folders, props.allFolders, props.type);
		}

		modelValue.value = false;
		emit('done');
	} catch (error) {
		unexpectedError(error);
	} finally {
		saving.value = false;
	}
}
</script>

<template>
	<VDialog v-model="modelValue" persistent @esc="modelValue = false" @apply="save">
		<VCard>
			<VCardTitle>{{ $t('delete_folder') }}</VCardTitle>

			<VCardText>
				<p>{{ t(`${translationKey}.content_behavior`) }}</p>
				<div class="radio-options">
					<VRadio
						v-for="option in radioOptions"
						:key="option.value"
						v-model="deleteMode"
						:value="option.value"
						:label="option.label"
					/>
				</div>
			</VCardText>

			<VCardActions>
				<VButton secondary @click="modelValue = false">{{ $t('cancel') }}</VButton>
				<VButton kind="danger" :loading="saving" @click="save">{{ $t('delete_label') }}</VButton>
			</VCardActions>
		</VCard>
	</VDialog>
</template>

<style lang="scss" scoped>
.radio-options {
	margin-block-start: 0.675rem;

	.v-radio + .v-radio {
		margin-block-start: 0.45rem;
	}
}
</style>
