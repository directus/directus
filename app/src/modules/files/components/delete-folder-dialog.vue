<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '@/api';
import VButton from '@/components/v-button.vue';
import VCardActions from '@/components/v-card-actions.vue';
import VCardText from '@/components/v-card-text.vue';
import VCardTitle from '@/components/v-card-title.vue';
import VCard from '@/components/v-card.vue';
import VDialog from '@/components/v-dialog.vue';
import VRadio from '@/components/v-radio.vue';
import { Folder } from '@/composables/use-folders';
import { unexpectedError } from '@/utils/unexpected-error';

const modelValue = defineModel<boolean>({ required: true });

const props = defineProps<{
	folders: Folder[];
	allFolders: Folder[];
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

const radioOptions = [
	{ value: 'move', label: t('delete_folder_move_content') },
	{ value: 'delete', label: t('delete_folder_delete_content') },
];

async function save() {
	if (saving.value) return;
	saving.value = true;

	try {
		if (deleteMode.value === 'move') {
			await moveAndDelete();
		} else {
			await recursiveDelete();
		}

		modelValue.value = false;
		emit('done');
	} catch (error) {
		unexpectedError(error);
	} finally {
		saving.value = false;
	}
}

async function moveAndDelete() {
	await Promise.all(props.folders.map(moveSingleFolder));

	await api.delete('/folders', { data: props.folders.map((f) => f.id) });
}

async function moveSingleFolder(folder: Folder) {
	const newParent = folder.parent ?? null;

	const [foldersRes, filesRes] = await Promise.all([
		api.get('/folders', {
			params: { filter: { parent: { _eq: folder.id } }, fields: ['id'], limit: -1 },
		}),
		api.get('/files', {
			params: { filter: { folder: { _eq: folder.id } }, fields: ['id'], limit: -1 },
		}),
	]);

	const childFolderIds: string[] = foldersRes.data.data.map((f: { id: string }) => f.id);
	const childFileIds: string[] = filesRes.data.data.map((f: { id: string }) => f.id);

	await Promise.all([
		childFolderIds.length > 0
			? api.patch('/folders', { keys: childFolderIds, data: { parent: newParent } })
			: Promise.resolve(),
		childFileIds.length > 0
			? api.patch('/files', { keys: childFileIds, data: { folder: newParent } })
			: Promise.resolve(),
	]);
}

function collectAllFolderIds(rootIds: string[]): string[] {
	const result = new Set<string>(rootIds);
	let changed = true;

	while (changed) {
		changed = false;

		for (const folder of props.allFolders) {
			if (folder.parent && result.has(folder.parent) && !result.has(folder.id)) {
				result.add(folder.id);
				changed = true;
			}
		}
	}

	return [...result];
}

async function recursiveDelete() {
	const allFolderIds = collectAllFolderIds(props.folders.map((f) => f.id));
	const allFolderIdSet = new Set(allFolderIds);

	const withParentInSet = props.allFolders
		.filter((f) => allFolderIdSet.has(f.id) && f.parent !== null && allFolderIdSet.has(f.parent!))
		.map((f) => f.id);

	if (withParentInSet.length > 0) {
		await api.patch('/folders', { keys: withParentInSet, data: { parent: null } });
	}

	const filesRes = await api.get('/files', {
		params: { filter: { folder: { _in: allFolderIds } }, fields: ['id'], limit: -1 },
	});

	const fileIds: string[] = filesRes.data.data.map((f: { id: string }) => f.id);

	if (fileIds.length > 0) {
		await api.delete('/files', { data: fileIds });
	}

	await api.delete('/folders', { data: allFolderIds });
}
</script>

<template>
	<VDialog v-model="modelValue" persistent @esc="modelValue = false" @apply="save">
		<VCard>
			<VCardTitle>{{ $t('delete_folder') }}</VCardTitle>

			<VCardText>
				<p>{{ $t('delete_folder_content_behavior') }}</p>
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
