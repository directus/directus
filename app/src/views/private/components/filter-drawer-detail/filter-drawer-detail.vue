<template>
	<drawer-detail
		:badge="filters.length > 0 ? filters.length : null"
		icon="filter_list"
		:title="$t('advanced_filter')"
	>
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

			<v-list dense>
				<field-list-item
					@add="addFilterForField"
					v-for="field in fieldTree"
					:key="field.field"
					:field="field"
				/>
			</v-list>
		</v-menu>
	</drawer-detail>
</template>

<script lang="ts">
import { defineComponent, PropType, computed, ref, watch } from '@vue/composition-api';
import { Filter, Relation, Field } from '@/types';
import { useFieldsStore, useRelationsStore } from '@/stores';
import FieldFilter from './field-filter.vue';
import { nanoid } from 'nanoid';
import { debounce } from 'lodash';
import { FieldTree } from './types';
import FieldListItem from './field-list-item.vue';

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
		const relationsStore = useRelationsStore();

		const fieldTree = computed<FieldTree[]>(() => {
			return fieldsStore
				.getFieldsForCollection(props.collection)
				.filter((field: Field) => field.meta?.hidden !== true && field.meta?.special?.toLowerCase() !== 'alias')
				.map((field: Field) => parseField(field, []));

			function parseField(field: Field, parents: Field[]) {
				const fieldInfo: FieldTree = {
					field: field.field,
					name: field.name,
				};

				if (parents.length === 2) {
					return fieldInfo;
				}

				const relations = relationsStore.getRelationsForField(field.collection, field.field);

				if (relations.length > 0) {
					const relatedFields = relations
						.map((relation: Relation) => {
							const relatedCollection =
								relation.many_collection === field.collection
									? relation.one_collection
									: relation.many_collection;

							if (relation.junction_field === field.field) return [];

							return fieldsStore
								.getFieldsForCollection(relatedCollection)
								.filter(
									(field: Field) =>
										field.meta?.hidden !== true && field.meta?.special?.toLowerCase() !== 'alias'
								);
						})
						.flat()
						.map((childField: Field) => parseField(childField, [...parents, field]));

					fieldInfo.children = relatedFields;
				}

				return fieldInfo;
			}
		});

		const localFilters = ref<Filter[]>([]);

		watch(
			() => props.value,
			() => {
				localFilters.value = props.value?.filter((filter) => {
					return !!fieldsStore.getField(props.collection, filter.field);
				});
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

		return { fieldTree, addFilterForField, filters, removeFilter, updateFilter };

		function addFilterForField(fieldKey: string) {
			emit('input', [
				...props.value,
				{
					key: nanoid(),
					field: fieldKey,
					operator: 'contains',
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
