<template>
	<v-notice v-if="!relationInfo || collection !== relationInfo?.relatedCollection.collection" type="warning">
		{{ t('interfaces.list-o2m-tree-view.recursive_only') }}
	</v-notice>

	<div v-else class="tree-view">
		<nested-draggable
			v-model="_value"
			:template="template"
			:collection="collection"
			:field="field"
			:primary-key="primaryKey"
			:relation-info="relationInfo"
			:disabled="disabled"
			:fields="fields"
			:enable-create="enableCreate"
			:enable-select="enableSelect"
			:custom-filter="customFilter"
			:items-moved="itemsMoved"
			root
		/>
	</div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { ref, computed, inject, toRefs } from 'vue';
import { getFieldsFromTemplate } from '@directus/shared/utils';
import NestedDraggable from './nested-draggable.vue';
import { Filter } from '@directus/shared/types';
import { parseFilter } from '@/utils/parse-filter';
import { render } from 'micromustache';
import { deepMap } from '@directus/shared/utils';
import { useRelationO2M } from '@/composables/use-relation-o2m';
import { ChangesItem } from '@/composables/use-relation-multiple';
import { addRelatedPrimaryKeyToFields } from '@/utils/add-related-primary-key-to-fields';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';

const props = withDefaults(
	defineProps<{
		value?: (number | string | Record<string, any>)[] | Record<string, any>;
		displayTemplate?: string;
		disabled?: boolean;
		collection: string;
		field: string;
		primaryKey: string | number;
		enableCreate?: boolean;
		enableSelect?: boolean;
		filter?: Filter | null;
	}>(),
	{
		value: () => [],
		disabled: false,
		enableCreate: true,
		enableSelect: true,
		filter: () => null,
		displayTemplate: undefined,
	}
);

const emit = defineEmits(['input']);
const { collection, field, primaryKey } = toRefs(props);

const _value = computed<ChangesItem>({
	get() {
		if (Array.isArray(props.value))
			return {
				create: [],
				update: [],
				delete: [],
			};
		return props.value as ChangesItem;
	},
	set: (val) => {
		emit('input', val);
	},
});

const { t } = useI18n();

const values = inject('values', ref<Record<string, any>>({}));

const customFilter = computed(() => {
	return parseFilter(
		deepMap(props.filter, (val: any) => {
			if (val && typeof val === 'string') {
				return render(val, values.value);
			}

			return val;
		})
	);
});

const itemsMoved = computed(() => {
	const pkField = relationInfo.value?.relatedPrimaryKeyField.field;
	if (!pkField) return [];

	return map(_value.value, (item) => {
		if (typeof item === 'object') {
			return item[pkField] as string | number;
		}
		return item;
	});
});

function map<T>(item: ChangesItem | undefined, fn: (v: Record<string, any> | string | number) => T): T[] {
	if (item === undefined || Array.isArray(item ?? [])) return [];
	return [
		...item.update.map(fn),
		...item.delete.map(fn),
		...item.create.map((i) => map(i[field.value], fn)).flat(),
		...item.update.map((i) => map(i[field.value], fn)).flat(),
	];
}

const { relationInfo } = useRelationO2M(collection, field);

const template = computed(() => {
	return (
		props.displayTemplate ||
		relationInfo.value?.relatedCollection?.meta?.display_template ||
		`{{${relationInfo.value?.relatedPrimaryKeyField.field}}}`
	);
});

const fields = computed(() => {
	if (!relationInfo.value) return [];

	const displayFields = adjustFieldsForDisplays(
		getFieldsFromTemplate(template.value),
		relationInfo.value.relatedCollection.collection
	);

	return addRelatedPrimaryKeyToFields(relationInfo.value?.relatedCollection.collection ?? '', displayFields);
});
</script>

<style scoped>
:deep(ul),
:deep(li) {
	list-style: none;
}

:deep(ul) {
	margin-left: 24px;
	padding-left: 0;
}
</style>
