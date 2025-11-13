<script setup lang="ts">
import { ChangesItem } from '@/composables/use-relation-multiple';
import { useRelationO2M } from '@/composables/use-relation-o2m';
import { addRelatedPrimaryKeyToFields } from '@/utils/add-related-primary-key-to-fields';
import { adjustFieldsForDisplays } from '@/utils/adjust-fields-for-displays';
import { parseFilter } from '@/utils/parse-filter';
import type { ContentVersion, Filter } from '@directus/types';
import { deepMap, getFieldsFromTemplate } from '@directus/utils';
import { render } from 'micromustache';
import { computed, inject, ref, toRefs } from 'vue';
import NestedDraggable from './nested-draggable.vue';

const props = withDefaults(
	defineProps<{
		value?: (number | string | Record<string, any>)[] | Record<string, any>;
		disabled?: boolean;
		collection: string;
		field: string;
		primaryKey: string | number;
		version: ContentVersion | null;
		displayTemplate?: string;
		enableCreate?: boolean;
		enableSelect?: boolean;
		filter?: Filter | null;
	}>(),
	{
		value: () => [],
		disabled: false,
		enableCreate: true,
		enableSelect: true,
		filter: null,
		displayTemplate: undefined,
	},
);

const emit = defineEmits(['input']);
const { collection, field, primaryKey } = toRefs(props);

const _value = computed<ChangesItem>({
	get() {
		if (Array.isArray(props.value)) {
			return {
				create: [],
				update: [],
				delete: [],
			};
		}

		return props.value as ChangesItem;
	},
	set: (val) => {
		emit('input', val);
	},
});

const values = inject('values', ref<Record<string, any>>({}));

const customFilter = computed(() => {
	return parseFilter(
		deepMap(props.filter, (val: any) => {
			if (val && typeof val === 'string') {
				return render(val, values.value);
			}

			return val;
		}),
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
		relationInfo.value.relatedCollection.collection,
	);

	return addRelatedPrimaryKeyToFields(relationInfo.value?.relatedCollection.collection ?? '', displayFields);
});
</script>

<template>
	<v-notice v-if="!relationInfo || collection !== relationInfo?.relatedCollection.collection" type="warning">
		{{ $t('interfaces.list-o2m-tree-view.recursive_only') }}
	</v-notice>
	<v-notice v-else-if="relationInfo.relatedCollection.meta?.singleton" type="warning">
		{{ $t('no_singleton_relations') }}
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
			:version
			root
		/>
	</div>
</template>

<style scoped>
:deep(ul),
:deep(li) {
	list-style: none;
}

:deep(ul) {
	margin-inline-start: 24px;
	padding-inline-start: 0;
}
</style>
