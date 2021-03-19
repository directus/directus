<template>
	<div class="tree-view">
		<nested-draggable
			:template="template"
			:collection="collection"
			:tree="stagedValues"
			:primary-key-field="primaryKeyField.field"
			:children-field="relation.one_field"
			root
			@change="onDraggableChange"
			@input="emitValue"
		/>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, PropType, onMounted, watch } from '@vue/composition-api';
import { useCollection } from '@/composables/use-collection';
import { useRelationsStore } from '@/stores';
import api from '@/api';
import getFieldsFromTemplate from '@/utils/get-fields-from-template';
import draggable from 'vuedraggable';
import hideDragImage from '@/utils/hide-drag-image';
import NestedDraggable from './nested-draggable.vue';

import { ChangesObject } from './types';
import { Relation } from '@/types';

export default defineComponent({
	components: { draggable, NestedDraggable },
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
		const { loading, error, stagedValues, fetchValues, emitValue } = useValues();

		const template = computed(() => {
			return props.displayTemplate || info.value?.meta?.display_template || `{{${primaryKeyField.value.field}}}`;
		});

		onMounted(fetchValues);
		watch(() => props.primaryKey, fetchValues, { immediate: true });

		const dragging = ref(false);

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
			hideDragImage,
			dragging,
			emitValue,
		};

		function useValues() {
			const loading = ref(false);
			const error = ref<any>(null);

			const stagedValues = ref<Record<string, any>[]>([]);

			return { loading, error, stagedValues, fetchValues, emitValue };

			async function fetchValues() {
				if (!props.primaryKey || !relation.value || props.primaryKey === '+') return;

				loading.value = true;

				try {
					const response = await api.get(`/items/${props.collection}/${props.primaryKey}`, {
						params: {
							fields: getFieldsToFetch(),
						},
					});

					stagedValues.value = response.data.data?.[relation.value.one_field!] ?? [];
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

			function emitValue(value: Record<string, any>[]) {
				stagedValues.value = value;

				if (relation.value.sort_field) {
					return emit('input', addSort(value));
				}

				emit('input', value);

				function addSort(value: Record<string, any>[]): Record<string, any>[] {
					return value.map((item, index) => {
						return {
							...item,
							[relation.value.sort_field!]: index,
							[relation.value.one_field!]: addSort(item[relation.value.one_field!]),
						};
					});
				}
			}
		}

		function useRelation() {
			const relation = computed<Relation>(() => {
				return relationsStore.getRelationsForField(props.collection, props.field)?.[0];
			});

			return { relation };
		}

		function onDraggableChange() {
			emit('input', stagedValues.value);
		}
	},
});
</script>

<style lang="scss" scoped>
::v-deep {
	ul,
	li {
		list-style: none;
	}

	ul {
		margin-left: 24px;
		padding-left: 0;
	}
}
</style>
