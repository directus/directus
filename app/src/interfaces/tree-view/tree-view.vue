<template>
	<div class="interface-tree-view">
		<v-list v-model="openItems" :mandatory="false">
			<draggable
				@change="onSortChange"
				handle=".drag-handle"
				:list="previewValues[relation.one_field]"
				:group="{ name: `${collection}.${field}` }"
			>
				<tree-view-group
					v-for="item in previewValues[relation.one_field]"
					:key="item[primaryKeyField]"
					:primary-key-field="primaryKeyField.field"
					:children-field="relation.one_field"
					:template="template"
					:item="item"
					:collection="collection"
					:draggable-group="`${collection}.${field}`"
				/>
			</draggable>
		</v-list>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, PropType, watch } from '@vue/composition-api';
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

		const { loading, error, previewValues, fetchValues } = useValues();

		const template = computed(() => {
			return (
				'{{ name }}' ||
				props.displayTemplate ||
				info.value?.meta?.display_template ||
				`{{${primaryKeyField.value.field}}}`
			);
		});

		const changesObject = computed<ChangesObject>(() => {
			if (typeof props.value === 'object' && Array.isArray(props.value) === false) {
				return props.value as ChangesObject;
			}

			return {
				create: [],
				update: [],
				delete: [],
			};
		});

		onMounted(fetchValues);
		watch(() => props.primaryKey, fetchValues, { immediate: true });

		return {
			changesObject,
			relation,
			openItems,
			template,
			loading,
			error,
			previewValues,
			fetchValues,
			primaryKeyField,
			onSortChange,
		};

		function useValues() {
			const loading = ref(false);
			const error = ref<any>(null);

			const previewValues = ref<Record<string, any>>({});

			return { loading, error, previewValues, fetchValues };

			async function fetchValues() {
				if (!props.primaryKey || !relation.value || props.primaryKey === '+') return;

				loading.value = true;

				try {
					const response = await api.get(`/items/${props.collection}/${props.primaryKey}`, {
						params: {
							fields: getFieldsToFetch(),
						},
					});

					previewValues.value = response.data.data;
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
		}

		function useRelation() {
			const relation = computed(() => {
				return relationsStore.getRelationsForField(props.collection, props.field)?.[0];
			});

			return { relation };
		}

		function onSortChange(changes: any) {
			console.log(changes);
			if (changes.added) {
				const { element } = changes.added;

				emit('input', {
					create: [...changesObject.value.create, element],
					update: [],
					delete: changesObject.value.delete.filter((item) => item !== element),
				});
			}

			if (changes.moved) {
				const { element } = changes.moved;
			}

			if (changes.removed) {
				const { element } = changes.removed;

				emit('input', {
					create: changesObject.value.create.filter((item) => item !== element),
					update: [],
					delete: [...changesObject.value.delete, element],
				});
			}
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
