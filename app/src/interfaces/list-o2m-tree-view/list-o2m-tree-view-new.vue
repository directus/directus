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
			:relationInfo="relationInfo"
			:disabled="disabled"
			root
			@change="onDraggableChange"
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
import { useRelationO2M } from '@/composables/use-relation';

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

const value = computed({
	get: () => props.value,
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

const {relationInfo} = useRelationO2M(collection, field)

const template = computed(() => {
	return props.displayTemplate || info.value?.meta?.display_template || `{{${primaryKeyField.value?.field}}}`;
});

const fields = computed(() => {
	const fields = [
		...new Set([
			primaryKeyField.value?.field,
			relation.value.meta!.one_field,
			...getFieldsFromTemplate(template.value),
		]),
	];

	return result;
})


function emitValue(value: Record<string, any>[] | null) {
	if (!value || value.length === 0) {
		stagedValues.value = [];
		emit('input', null);
	} else {
		stagedValues.value = value;

		if (relation.value.meta?.sort_field) {
			return emit('input', addSort(value));
		}

		emit('input', value);
	}

	function addSort(value: Record<string, any>[]): Record<string, any>[] {
		return (value || []).map((item, index) => {
			return {
				...item,
				[relation.value.meta!.sort_field!]: index + 1,
				[relation.value.meta!.one_field!]: addSort(item[relation.value.meta!.one_field!]),
			};
		});
	}
}

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
