<script setup lang="ts">
import { useCollection } from '@directus/composables';
import { getEndpoint } from '@directus/utils';
import { isObject } from 'lodash';
import { computed, ref, toRefs } from 'vue';
import PrivateViewHeaderBarActionButton from '../private-view/components/private-view-header-bar-action-button.vue';
import api from '@/api';
import VDrawer from '@/components/v-drawer.vue';
import VForm from '@/components/v-form/v-form.vue';
import { VALIDATION_TYPES } from '@/constants';
import { useFieldsStore } from '@/stores/fields';
import { useRelationsStore } from '@/stores/relations';
import { APIError } from '@/types/error';
import { fetchAll } from '@/utils/fetch-all';
import { unexpectedError } from '@/utils/unexpected-error';

type TranslationsFieldInfo = {
	field: string;
	creates: Record<string, any>[];
	junctionField: string;
};

const props = defineProps<{
	collection: string;
	primaryKeys: (number | string)[];
	active?: boolean;
	edits?: Record<string, any>;
	stageOnSave?: boolean;
}>();

const emit = defineEmits<{
	(e: 'update:active', value: boolean): void;
	(e: 'refresh'): void;
	(e: 'input', value: Record<string, any>): void;
}>();

const { internalEdits } = useEdits();
const { internalActive } = useActiveState();
const { save, cancel, saving, validationErrors } = useActions();

const { collection } = toRefs(props);
const { primaryKeyField } = useCollection(collection);
const fieldsStore = useFieldsStore();
const relationsStore = useRelationsStore();

function useEdits() {
	const localEdits = ref<Record<string, any>>({});

	const internalEdits = computed<Record<string, any>>({
		get() {
			if (props.edits !== undefined) {
				return {
					...props.edits,
					...localEdits.value,
				};
			}

			return localEdits.value;
		},
		set(newEdits) {
			localEdits.value = newEdits;
		},
	});

	return { internalEdits };
}

function useActiveState() {
	const localActive = ref(false);

	const internalActive = computed({
		get() {
			return props.active === undefined ? localActive.value : props.active;
		},
		set(newActive: boolean) {
			localActive.value = newActive;
			emit('update:active', newActive);
		},
	});

	return { internalActive };
}

function useActions() {
	const saving = ref(false);
	const validationErrors = ref([]);

	return { save, cancel, saving, validationErrors };

	async function save() {
		if (props.stageOnSave) {
			emit('input', internalEdits.value);
			internalActive.value = false;
			internalEdits.value = {};
			return;
		}

		saving.value = true;

		try {
			const translationsField = getTranslationsField(internalEdits.value);

			if (!translationsField) {
				await api.patch(getEndpoint(collection.value), {
					keys: props.primaryKeys,
					data: internalEdits.value,
				});
			} else {
				await saveBatchWithTranslations(translationsField);
			}

			emit('refresh');

			internalActive.value = false;
			internalEdits.value = {};
		} catch (error: any) {
			const errors = error?.response?.data?.errors;

			if (!errors) {
				unexpectedError(error);
				return;
			}

			validationErrors.value = errors
				.filter((err: APIError) => VALIDATION_TYPES.includes(err?.extensions?.code))
				.map((err: APIError) => {
					return err.extensions;
				});

			const otherErrors = errors.filter((err: APIError) => VALIDATION_TYPES.includes(err?.extensions?.code) === false);

			if (otherErrors.length > 0) {
				otherErrors.forEach(unexpectedError);
			}
		} finally {
			saving.value = false;
		}
	}

	function cancel() {
		internalActive.value = false;
		internalEdits.value = {};
	}
}

function getTranslationsField(edits: Record<string, any>): TranslationsFieldInfo | null {
	for (const [key, value] of Object.entries(edits)) {
		if (!isObject(value) || !('create' in value)) continue;

		const fieldInfo = fieldsStore.getField(collection.value, key);
		if (!fieldInfo?.meta?.special?.includes('translations')) continue;

		const relations = relationsStore.getRelationsForField(collection.value, key);
		const junctionField = relations.find((r) => r.meta?.one_field === key)?.meta?.junction_field;

		if (!junctionField) continue;

		return { field: key, creates: (value as any).create as Record<string, any>[], junctionField };
	}

	return null;
}

async function saveBatchWithTranslations({ field, creates, junctionField }: TranslationsFieldInfo) {
	const { [field]: _, ...otherEdits } = internalEdits.value;
	const pkField = primaryKeyField.value!.field;
	const endpoint = getEndpoint(collection.value);

	const existingItems = await fetchAll<Record<string, any>>(endpoint, {
		params: {
			filter: { [pkField]: { _in: props.primaryKeys } },
			fields: [pkField, `${field}.*`],
		},
	});

	const itemMap = new Map(existingItems.map((item) => [item[pkField], item]));
	const resolveId = (val: unknown) => (isObject(val) ? Object.values(val)[0] : val);

	const payload = props.primaryKeys
		.filter((pk) => itemMap.has(pk))
		.map((pk) => {
			const existing = itemMap.get(pk)![field] || [];
			const merged = [...existing];

			for (const item of creates) {
				const idx = merged.findIndex((e) => resolveId(e[junctionField]) === resolveId(item[junctionField]));
				if (idx >= 0) merged[idx] = { ...merged[idx], ...item };
				else merged.push(item);
			}

			return { [pkField]: pk, ...otherEdits, [field]: merged };
		});

	await api.patch(endpoint, payload);
}
</script>

<template>
	<VDrawer
		v-model="internalActive"
		:title="$t('editing_in_batch', { count: primaryKeys.length })"
		persistent
		@cancel="cancel"
		@apply="save"
	>
		<template #actions>
			<PrivateViewHeaderBarActionButton v-tooltip.bottom="$t('save')" :loading="saving" icon="check" @click="save" />
		</template>

		<div class="drawer-batch-content">
			<VForm
				v-model="internalEdits"
				:collection="collection"
				batch-mode
				primary-key="+"
				:validation-errors="validationErrors"
			/>
		</div>
	</VDrawer>
</template>

<style lang="scss" scoped>
.v-divider {
	margin: 52px 0;
}

.drawer-batch-content {
	padding: var(--content-padding);
	padding-block-end: var(--content-padding-bottom);
}
</style>
