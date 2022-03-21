<template>
	<v-notice
		v-if="!relationInfo || collection !== relationInfo?.relatedCollection.collection"
		type="warning"
	>{{ t('interfaces.list-o2m-tree-view.recursive_only') }}</v-notice>

	<div v-else class="tree-view">
		<nested-draggable
			v-model="value"
			:template="template"
			:collection="collection"
			:field="field"
			:primaryKey="primaryKey"
			:relationInfo="relationInfo"
			:disabled="disabled"
			:fields="fields"
			:enableCreate="enableCreate"
			:enableSelect="enableSelect"
			:customFilter="customFilter"
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
import { ChangesItem, useRelationO2M } from '@/composables/use-relation';

const props = withDefaults(defineProps<{
	value?: (number | string | Record<string, any>)[] | Record<string, any>
	displayTemplate?: string
	disabled?: boolean
	collection: string
	field: string
	primaryKey: string | number
	enableCreate?: boolean
	enableSelect?: boolean
	filter?: Filter | null
}>(), {
	value: () => [],
	disabled: false,
	enableCreate: true,
	enableSelect: true,
	filter: () => null
})

const emit = defineEmits(['input']);
const { collection, field, primaryKey } = toRefs(props);

const value = computed<ChangesItem>({
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

const conflictItems = computed(() => {
	return getConflicts(value.value as ChangesItem)

	function getConflicts(item: ChangesItem | undefined): (string | number)[] {
		const pkField = relationInfo.value?.relatedPrimaryKeyField.field

		if(item === undefined || Array.isArray(item ?? []) || !pkField) return []
		return [...item.update.map(i => i[pkField]), ...item.delete, ...item.create.map(i => getConflicts(i[field.value])).flat(), ...item.update.map(i => getConflicts(i[field.value])).flat()]
	}
})

const {relationInfo} = useRelationO2M(collection, field)

const template = computed(() => {
	return props.displayTemplate || relationInfo.value?.relatedCollection?.meta?.display_template || `{{${relationInfo.value?.relatedPrimaryKeyField.field}}}`;
});

const fields = computed(() => {
	return getFieldsFromTemplate(template.value);
})

function onDraggableChange() {
	console.log("Drag ")
}
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

.actions {
	margin-top: 12px;
}

.actions .v-button + .v-button {
	margin-left: 12px;
}

.existing {
	margin-left: 12px;
}
</style>
