<template>
	<div class="system-filter">
		<v-list :mandatory="true">
			<div v-if="innerValue.length === 0" class="no-rules">
				{{ t('interfaces.filter.no_rules') }}
			</div>
			<node
				v-else
				v-model:tree="innerValue"
				:collection="collectionName"
				:depth="1"
				@add-node="addNode($event)"
				@remove-node="removeNode($event)"
			/>
		</v-list>
		<div class="buttons">
			<div class="add" @click="addNode('field')">
				{{ t('interfaces.filter.add_filter') }}
			</div>
			<div class="add" @click="addNode('logic')">
				{{ t('interfaces.filter.add_group') }}
			</div>
		</div>
	</div>
</template>

<script lang="ts">
import { useFieldsStore } from '@/stores';
import { get, set, isEqual, debounce } from 'lodash';
import { defineComponent, ref, PropType, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { FilterOperator } from '@directus/shared/types';
import Node from './node.vue';

export type FilterTree = FilterNode[];

export type FilterNode = FilterField | FilterLogic;

export type FilterLogic = {
	type: 'logic';
	name: LogicOperators;
	values: FilterTree;
};

export type FilterField = {
	type: 'field';
	name: string;
	comparator: FilterOperators;
	value: any;
};

export type LogicOperators = '_and' | '_or';

export type FilterOperators = `_${FilterOperator}`;

export default defineComponent({
	components: {
		Node,
	},
	props: {
		value: {
			type: Object as PropType<Record<string, any>>,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		collectionName: {
			type: String,
			default: null,
		},
	},
	emits: ['input'],
	setup(props, { emit }) {
		const innerValue = ref<FilterTree>([]);
		const { t } = useI18n();
		const fieldsStore = useFieldsStore();

		watch(
			() => props.value,
			(newVal) => {
				if (newVal === null) {
					innerValue.value = [];
					return;
				}
				const newFilter = constructFilterTree(newVal);
				if (isEqual(innerValue.value, newFilter) === false && newFilter.type === 'logic')
					innerValue.value = newFilter.values;
			},
			{ immediate: true }
		);

		watch(
			innerValue,
			debounce((newVal: FilterTree) => {
				const newFilter = deconstructFilterTree({
					type: 'logic',
					name: '_and',
					values: newVal,
				});
				if (isEqual(newFilter, props.value) === false) emit('input', newFilter);
			}, 200),
			{ deep: true }
		);

		return { t, innerValue, deconstructFilterTree, constructFilterTree, addNode, removeNode };

		function addNode(type: 'logic' | 'field') {
			const list = innerValue.value;

			if (type === 'logic') {
				list.push({
					type: 'logic',
					name: '_and',
					values: [],
				});
			} else {
				list.push({
					type: 'field',
					name: fieldsStore.getPrimaryKeyFieldForCollection(props.collectionName).field,
					comparator: '_eq',
					value: 0,
				});
			}
			innerValue.value = list;
		}

		function removeNode(ids: number[]) {
			const id = ids.pop();
			if (ids.length === 0) {
				innerValue.value = innerValue.value.filter((node, index) => index !== id);
				return;
			}
			let list = get(innerValue.value, idsToPath(ids)) as FilterTree;

			list = list.filter((node, index) => index !== id);

			innerValue.value = set(innerValue.value, idsToPath(ids), list);
		}

		function idsToPath(id: number[]) {
			return id.map((v) => `[${v}]`).join('.values.') + '.values';
		}

		function deconstructFilterTree(tree: FilterNode): Record<string, any> | null {
			if (tree === undefined) return null;
			if (tree.type === 'logic') {
				return {
					[tree.name]: tree.values.map((value) => deconstructFilterTree(value)),
				};
			} else {
				if (!tree.name) return null;
				return set({}, tree.name, {
					[tree.comparator]: tree.value,
				});
			}
		}

		function constructFilterTree(tree: Record<string, any>, id = [0]): FilterNode {
			const key = Object.keys(tree)[0];
			if (key.startsWith('_') && Array.isArray(tree[key]) && key) {
				return {
					type: 'logic',
					name: key as LogicOperators,
					values: (tree[key] as Record<string, any>[]).map((subTree, index) =>
						constructFilterTree(subTree, [...id, index])
					),
				};
			} else {
				let destructTree = tree;
				let fieldList = [];
				let key = Object.keys(destructTree)[0];

				while (key.startsWith('_') === false) {
					fieldList.push(key);
					destructTree = destructTree[key];
					key = Object.keys(destructTree)[0];
				}

				return {
					type: 'field',
					name: fieldList.join('.'),
					comparator: key as FilterOperators,
					value: destructTree[key],
				};
			}
		}
	},
});
</script>

<style lang="scss" scoped>
.system-filter {
	:deep(ul),
	:deep(li) {
		list-style: none;
	}

	:deep(.group) {
		margin-left: 18px;
		padding-left: 10px;
		border-left: var(--border-width) solid var(--border-subdued);
	}

	.v-list {
		margin: 0px 0px 10px 0px;
		padding: 20px 20px 12px 20px;
		border: var(--border-width) solid var(--border-subdued);

		& > :deep(.group) {
			margin-left: 0px;
			padding-left: 0px;
			border-left: none;
		}

		.no-rules {
			margin-bottom: 8px;
			color: var(--foreground-subdued);
			font-family: var(--family-monospace);
		}
	}

	.buttons {
		display: flex;
		gap: 10px;
		padding: 0 10px;
		color: var(--primary);
		font-weight: 700;

		.add {
			cursor: pointer;
		}
	}
}
</style>
