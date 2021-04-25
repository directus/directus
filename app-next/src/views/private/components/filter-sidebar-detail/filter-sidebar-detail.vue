<template>
	<sidebar-detail :badge="filters.length > 0 ? filters.length : null" icon="filter_list" :title="$t('advanced_filter')">
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
				<v-input @click="toggle" :class="{ active }" readonly :value="$t('add_filter')" :disabled="loading">
					<template #prepend><v-icon name="add" /></template>
					<template #append><v-icon name="expand_more" /></template>
				</v-input>
			</template>

			<v-list :multiple="false">
				<field-list-item @add="addFilterForField" v-for="field in fieldTree" :key="field.field" :field="field" />
			</v-list>
		</v-menu>

		<template v-if="showArchiveToggle">
			<v-divider />

			<v-checkbox v-model="archived" :label="$t('show_archived_items')" />
		</template>
	</sidebar-detail>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, watch, toRefs } from '@vue/composition-api';
import { Filter } from '@/types';
import { useFieldsStore } from '@/stores';
import FieldFilter from './field-filter.vue';
import { nanoid } from 'nanoid';
import { debounce } from 'lodash';
import FieldListItem from './field-list-item.vue';
import { useCollection } from '@/composables/use-collection';
import getAvailableOperatorsForType from './get-available-operators-for-type';
import { useFieldTree } from '@/composables/use-field-tree';

export default defineComponent({
	components: { FieldFilter, FieldListItem },
	props: {
		value: {
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
	setup(props, { emit }) {
		const fieldsStore = useFieldsStore();

		const { collection } = toRefs(props);
		const { info: collectionInfo } = useCollection(collection);

		const { tree: fieldTree } = useFieldTree(collection);

		const localFilters = ref<Filter[]>([]);

		watch(
			() => props.value,
			() => {
				localFilters.value = props.value;
			},
			{ immediate: true }
		);

		const syncWithProp = debounce(() => {
			emit('input', localFilters.value);
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
				return props.value.find((filter) => filter.locked === true && filter.key === 'hide-archived') === undefined;
			},
			set(showArchived: boolean) {
				if (!collectionInfo.value?.meta?.archive_field) return;

				if (showArchived === false) {
					emit('input', [
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
						'input',
						filters.value.filter((filter) => filter.key !== 'hide-archived')
					);
				}
			},
		});

		return { fieldTree, addFilterForField, filters, removeFilter, updateFilter, showArchiveToggle, archived };

		function addFilterForField(fieldKey: string) {
			const field = fieldsStore.getField(props.collection, fieldKey);
			const defaultOperator = getAvailableOperatorsForType(field.type).operators[0];

			emit('input', [
				...props.value,
				{
					key: nanoid(),
					field: fieldKey,
					operator: defaultOperator || 'contains',
					value: '',
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
