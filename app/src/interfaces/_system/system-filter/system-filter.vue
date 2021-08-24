<template>
	<div class="system-filter">
		<v-list :mandatory="true">
			<nested-draggable
				v-model:tree="innerValue"
				:collection="collectionName"
				:depth="1"
				@add-node="addNode($event)"
				@remove-node="removeNode($event)"
			/>
		</v-list>
	</div>
</template>

<script lang="ts">
import { get, set, isEqual, debounce } from 'lodash';
import { defineComponent, ref, PropType, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import NestedDraggable from './nested-draggable.vue';

export type FilterTree = (Field | Logic)[];

export type Logic = {
	type: 'logic';
	name: LogicOperators;
	values: FilterTree;
	open: boolean;
};

export type Field = {
	type: 'field';
	name: string;
	comparator: FilterOperators;
	value: any;
	open: boolean;
};

export const logicOperators = ['and', 'or'] as const;
export type LogicOperators = `_${typeof logicOperators[number]}`;

export const filterOperators = [
	'eq',
	'neq',
	'lt',
	'lte',
	'gt',
	'gte',
	'in',
	'nin',
	'null',
	'nnull',
	'contains',
	'ncontains',
	'starts_with',
	'nstarts_with',
	'ends_with',
	'nends_with',
	'between',
	'nbetween',
	'empty',
	'nempty',
] as const;
export type FilterOperators = `_${typeof filterOperators[number]}`;

export default defineComponent({
	components: {
		NestedDraggable,
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

		watch(
			() => props.value,
			(newVal) => {
				if (newVal === null) {
					innerValue.value = [];
					return;
				}
				const newFilter = [constructFilterTree(newVal)];
				if (isEqual(innerValue.value, newFilter) === false) innerValue.value = newFilter;
			},
			{ immediate: true }
		);

		watch(
			innerValue,
			debounce((newVal) => {
				const newFilter = deconstructFilterTree(newVal[0]);
				if (isEqual(newFilter, props.value) === false) emit('input', newFilter);
			}, 200),
			{ deep: true }
		);

		return { t, innerValue, deconstructFilterTree, constructFilterTree, addNode, removeNode };

		function addNode(ids: number[]) {
			if (ids.length === 0) {
				const list = innerValue.value;
				list.push({
					type: 'logic',
					name: '_and',
					values: [],
					open: true,
				});
				innerValue.value = list;
				return;
			}

			const list = get(innerValue.value, idsToPath(ids));

			list.push({
				type: 'logic',
				name: '_and',
				values: [],
			});

			innerValue.value = set(innerValue.value, idsToPath(ids), list);
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

		function deconstructFilterTree(tree: Field | Logic): Record<string, any> | null {
			if (tree === undefined) return null;
			if (tree.type === 'logic') {
				return {
					[tree.name]: tree.values.map((value) => deconstructFilterTree(value)),
				};
			} else {
				return set({}, tree.name, {
					[tree.comparator]: tree.value,
				});
			}
		}

		function constructFilterTree(tree: Record<string, any>, id = [0]): Field | Logic {
			const key = Object.keys(tree)[0];
			if (key.startsWith('_') && Array.isArray(tree[key]) && key) {
				return {
					type: 'logic',
					name: key as LogicOperators,
					values: (tree[key] as Record<string, any>[]).map((subTree, index) =>
						constructFilterTree(subTree, [...id, index])
					),
					open: true,
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
					open: true,
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

	:deep(ul) {
		margin-left: 8px;
		padding-right: 8px;
		padding-left: 0;
	}

	.v-list {
		margin-left: 0px;

		& > :deep(.group),
		& > :deep(.add) {
			margin-left: 0px;
		}
	}
}
</style>
