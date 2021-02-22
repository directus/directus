<template>
	<div class="interface-tree-view">
		<v-list>
			<tree-view-item
				v-for="item in previewValues[relation.one_field]"
				:key="item[primaryKeyField]"
				:primary-key-field="primaryKeyField.field"
				:children-field="relation.one_field"
				:template="template"
				:item="item"
				:collection="collection"
			/>
		</v-list>
	</div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from '@vue/composition-api';
import { useCollection } from '@/composables/use-collection';
import { useRelationsStore } from '@/stores';
import api from '@/api';
import getFieldsFromTemplate from '@/utils/get-fields-from-template';
import TreeViewItem from './tree-view-item.vue';

export default defineComponent({
	components: { TreeViewItem },
	props: {
		value: {
			type: Array,
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
			type: String,
			default: undefined,
		},
	},
	setup(props) {
		const relationsStore = useRelationsStore();
		const openItems = ref([]);

		const { relation } = useRelation();

		const { info, primaryKeyField } = useCollection(relation.value.one_collection);

		const { loading, error, previewValues, fetchValues } = useValues();

		const template = computed(() => {
			return props.displayTemplate || info.value?.meta?.display_template || `{{${primaryKeyField.value.field}}}`;
		});

		onMounted(fetchValues);

		return { relation, openItems, template, loading, error, previewValues, fetchValues, primaryKeyField };

		function useValues() {
			const loading = ref(false);
			const error = ref<any>(null);

			const previewValues = ref<Record<string, any>>({});

			return { loading, error, previewValues, fetchValues };

			async function fetchValues() {
				if (!props.primaryKey || !relation.value) return;

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
	},
});
</script>

<style lang="scss" scoped>
.interface-tree-view {
	--v-list-item-background-color: var(--background-normal);

	border-radius: var(--border-radius);
}
</style>
