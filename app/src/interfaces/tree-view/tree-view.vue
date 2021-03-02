<template>
	<div class="interface-tree-view">
		<v-list v-model="openItems" :mandatory="false">
			<draggable
				handle=".drag-handle"
				:list="stagedValues[relation.one_field]"
				:group="{ name: `${collection}.${field}` }"
				@change="onDraggableChange"
			>
				<tree-view-group
					v-for="(item, index) in stagedValues[relation.one_field]"
					:key="item[primaryKeyField]"
					:primary-key-field="primaryKeyField.field"
					:children-field="relation.one_field"
					:template="template"
					:item="item"
					:collection="collection"
					:draggable-group="`${collection}.${field}`"
					@input="replaceItem(index, $event)"
					@change="onDraggableChange"
				/>
			</draggable>
		</v-list>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, onMounted, watch } from '@vue/composition-api';
import { useCollection } from '@/composables/use-collection';
import { useRelationsStore } from '@/stores';
import api from '@/api';
import getFieldsFromTemplate from '@/utils/get-fields-from-template';
import TreeViewGroup from './tree-view-group.vue';
import draggable from 'vuedraggable';

import { ChangesObject } from './types';

export default defineComponent({
	components: { TreeViewGroup, draggable },
	props: {
		value: {
			type: [Array, Object] as PropType<(number | string)[] | ChangesObject>,
			default: null,
		},
		displayTemplate: {
			type: String,
			default: undefined,
		},
		collection: {
			type: String,
			required: true,
		},
		field: {
			type: String,
			required: true,
		},
		primaryKey: {
			type: [String, Number],
			default: undefined,
		},
	},
	setup(props, { emit }) {
		const relationsStore = useRelationsStore();
		const openItems = ref([]);

		const { relation } = useRelation();
		const { info, primaryKeyField } = useCollection(relation.value.one_collection);
		const { loading, error, stagedValues, fetchValues, replaceItem } = useValues();

		const template = computed(() => {
			return props.displayTemplate || info.value?.meta?.display_template || `{{${primaryKeyField.value.field}}}`;
		});

		onMounted(fetchValues);
		watch(() => props.primaryKey, fetchValues, { immediate: true });

		return {
			relation,
			openItems,
			template,
			loading,
			error,
			stagedValues,
			fetchValues,
			primaryKeyField,
			onDraggableChange,
			replaceItem,
		};

		function useValues() {
			const loading = ref(false);
			const error = ref<any>(null);

			const stagedValues = ref<Record<string, any>>({});

			return { loading, error, stagedValues, fetchValues, replaceItem };

			async function fetchValues() {
				if (!props.primaryKey || !relation.value || props.primaryKey === '+') return;

				loading.value = true;

				try {
					const response = await api.get(`/items/${props.collection}/${props.primaryKey}`, {
						params: {
							fields: getFieldsToFetch(),
						},
					});

					stagedValues.value = response.data.data;
				} catch (err) {
					error.value = err;
				} finally {
					loading.value = false;
				}
			}

			function getFieldsToFetch() {
				const fields = [
					...new Set([primaryKeyField.value.field, relation.value.one_field, ...getFieldsFromTemplate(template.value)]),
				];

				const result: string[] = [];

				const prefix = `${relation.value.one_field}.`;

				for (let i = 1; i <= 5; i++) {
					for (const field of fields) {
						result.push(`${prefix.repeat(i)}${field}`);
					}
				}

				return result;
			}

			function replaceItem(index: number, item: Record<string, any>) {
				stagedValues.value = {
					...stagedValues.value,
					[relation.value.one_field]: (stagedValues.value[relation.value.one_field] as any[]).map(
						(value: any, childIndex) => {
							if (childIndex === index) {
								return item;
							}

							return value;
						}
					),
				};

				emit('input', stagedValues.value[relation.value.one_field]);
			}
		}

		function useRelation() {
			const relation = computed(() => {
				return relationsStore.getRelationsForField(props.collection, props.field)?.[0];
			});

			return { relation };
		}

		function onDraggableChange() {
			emit('input', stagedValues.value[relation.value.one_field]);
		}
	},
});
</script>

<style lang="scss" scoped>
.interface-tree-view {
	--v-list-item-background-color: var(--background-normal);

	border-radius: var(--border-radius);
}
</style>
