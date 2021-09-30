<template>
	<sidebar-detail :badge="filters.length > 0 ? filters.length : null" icon="filter_list" :title="t('advanced_filter')">
		<field-filter
			v-for="filter in filters"
			:key="filter.key"
			:filter="filter"
			:collection="collection"
			:disabled="loading"
			@update="updateFilter(filter.key, $event)"
			@remove="removeFilter(filter.key)"
		/>

		<v-divider v-if="filters.length" />

		<v-menu attached :disabled="loading">
			<template #activator="{ toggle, active }">
				<v-input
					clickable
					:class="{ active }"
					readonly
					:model-value="t('add_filter')"
					:disabled="loading"
					@click="toggle"
				>
					<template #prepend><v-icon name="add" /></template>
					<template #append><v-icon name="expand_more" /></template>
				</v-input>
			</template>

			<v-list @toggle="loadFieldRelations($event.value, 1)">
				<field-list-item v-for="field in treeList" :key="field.field" :field="field" @add="addFilterForField" />
			</v-list>
		</v-menu>

		<template v-if="showArchiveToggle">
			<v-divider />

			<v-checkbox v-model="archived" :label="t('show_archived_items')" />
		</template>
	</sidebar-detail>
</template>

<script lang="ts">
import { useI18n } from 'vue-i18n';
import { defineComponent, PropType, computed, ref, watch, toRefs } from 'vue';
import { Field, Filter } from '@directus/shared/types';
import { useFieldsStore } from '@/stores';
import FieldFilter from './field-filter.vue';
import { nanoid } from 'nanoid';
import { debounce } from 'lodash';
import FieldListItem from './field-list-item.vue';
import { useCollection } from '@directus/shared/composables';
import { getFilterOperatorsForType } from '@directus/shared/utils';
import { useFieldTree } from '@/composables/use-field-tree';

export default defineComponent({
	components: { FieldFilter, FieldListItem },
	props: {
		modelValue: {
			type: Array as PropType<Filter[]>,
			required: true,
		},
		collection: {
			type: String,
			required: true,
		},
		loading: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const { t } = useI18n();

		const fieldsStore = useFieldsStore();

		const { collection } = toRefs(props);
		const { info: collectionInfo } = useCollection(collection);

		const { treeList, loadFieldRelations } = useFieldTree(collection);

		const localFilters = ref<Filter[]>([]);

		watch(
			() => props.modelValue,
			() => {
				localFilters.value = props.modelValue;
			},
			{ immediate: true }
		);

		const syncWithProp = debounce(() => {
			emit('update:modelValue', localFilters.value);
		}, 850);

		const filters = computed<Filter[]>({
			get() {
				return localFilters.value.filter((filter) => {
					return filter.locked !== true;
				});
			},
			set(newFilters) {
				localFilters.value = newFilters;
				syncWithProp();
			},
		});

		const showArchiveToggle = computed(
			() => !!collectionInfo.value?.meta?.archive_field && !!collectionInfo.value?.meta?.archive_app_filter
		);

		const archived = computed({
			get() {
				return (
					props.modelValue.find((filter) => filter.locked === true && filter.key === 'hide-archived') === undefined
				);
			},
			set(showArchived: boolean) {
				if (!collectionInfo.value?.meta?.archive_field) return;

				if (showArchived === false) {
					emit('update:modelValue', [
						...filters.value,
						{
							key: 'hide-archived',
							field: collectionInfo.value.meta.archive_field,
							operator: 'neq',
							value: collectionInfo.value.meta.archive_value!,
							locked: true,
						},
					]);
				} else {
					emit(
						'update:modelValue',
						filters.value.filter((filter) => filter.key !== 'hide-archived')
					);
				}
			},
		});

		return {
			t,
			treeList,
			addFilterForField,
			filters,
			removeFilter,
			updateFilter,
			showArchiveToggle,
			archived,
			loadFieldRelations,
		};

		function addFilterForField(fieldKey: string) {
			const field = fieldsStore.getField(props.collection, fieldKey) as Field;
			const defaultOperator = getFilterOperatorsForType(field.type)[0];

			emit('update:modelValue', [
				...props.modelValue,
				{
					key: nanoid(),
					field: fieldKey,
					operator: defaultOperator || 'contains',
					value: field.type === 'boolean' ? true : '',
				},
			]);
		}

		function updateFilter(key: string, updates: Filter) {
			filters.value = filters.value.map((filter) => {
				if (filter.key === key) {
					return { ...filter, ...updates };
				}

				return filter;
			});
		}

		function removeFilter(key: string) {
			filters.value = filters.value.filter((filter) => filter.key !== key);
		}
	},
});
</script>

<style lang="scss" scoped>
.v-divider {
	margin: 16px 0;
}

.field-filter {
	margin-bottom: 16px;
}
</style>
