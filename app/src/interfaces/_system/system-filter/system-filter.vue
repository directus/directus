<template>
	<div class="system-filter">
		<v-list :mandatory="true">
			<nested-draggable :tree="tree" :collection="collection" />
		</v-list>
	</div>
</template>

<script lang="ts">
import { GroupableInstance } from '@/composables/groupable/groupable';
import useFieldTreeAdvanced from '@/composables/use-field-tree-advanced';
import collection from '@/displays/collection';
import { set } from 'lodash';
import { defineComponent, computed, inject, ref, PropType, toRefs, Ref } from 'vue';
import NestedDraggable from './nested-draggable.vue'

export type FilterTree = (Field | Logic)[]

export type Logic = {
	type: 'logic',
	name: LogicOperators,
	values: FilterTree
}

export type Field = {
	type: 'field',
	name: string,
	comparator: FilterOperators,
	value: any
}

export const logicOperators = ['and', 'or'] as const
export type LogicOperators = `_${typeof logicOperators[number]}`


export const filterOperators = ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in', 'nin', 'null', 'nnull', 'contains', 'ncontains', 'starts_with', 'nstarts_with', 'ends_with', 'nends_with', 'between', 'nbetween', 'empty', 'nempty'] as const
export type FilterOperators = `_${typeof filterOperators[number]}`

export default defineComponent({
	components: {
		NestedDraggable
	},
	props: {
		value: {
			type: Array as PropType<Record<string, any>[]>,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		collection: {
            type: String,
            default: null
        }
	},
	emits: ['input'],
	setup(props, {emit}) {
		const {collection} = toRefs(props)

		const tree = ref<FilterTree>([
			{
				type: 'logic',
				name: '_or',
				values: [
					{
						type: 'logic',
						name: '_and',
						values: [
							{
								type: 'field',
								name: 'filter',
								comparator: '_eq',
								value: '$CURRENT_USER'
							},
							{
								type: 'field',
								name: 'aa.ddd_id.mylist',
								comparator: '_in',
								value: ["published", "draft"]
							}
						]
					},
					{
						type: 'logic',
						name: '_and',
						values: [
							{
								type: 'field',
								name: 'filter',
								comparator: '_neq',
								value: '$CURRENT_USER'
							},
							{
								type: 'field',
								name: 'aa.ddd_id.mylist',
								comparator: '_in',
								value: ["published"]
							}
						]
					}
				]
			}
		])

		const innerValue = computed<FilterTree>({
			get() {
				return [constructFilterTree(props.value)]
			},
			set(newVal) {
				emit('input', deconstructFilterTree(newVal[0]))
			}
		})

		const selected = ref("")

		return { tree, innerValue, selected, deconstructFilterTree, constructFilterTree };

		function deconstructFilterTree(tree: Field | Logic): Record<string, any> {
			if(tree.type === 'logic') {
				return {
					[tree.name]: tree.values.map(value => deconstructFilterTree(value))
				}
			} else {
				return set({}, tree.name, {
					[tree.comparator]: tree.value
				})
			}
		}

		function constructFilterTree(tree: Record<string, any>): Field | Logic {
			const key = Object.keys(tree)[0]
			if(key.startsWith('_') && Array.isArray(tree[key]) && key ) {
				return {
					type: 'logic',
					name: key as LogicOperators,
					values: (tree[key] as Record<string, any>[]).map(subTree => constructFilterTree(subTree))
				}
			} else {
				let destructTree = tree
				let fieldList = []
				let key = Object.keys(destructTree)[0]

				while(key.startsWith('_') === false) {
					fieldList.push(key)
					destructTree = destructTree[key]
					key = Object.keys(destructTree)[0]
				}

				return {
					type: 'field',
					name: fieldList.join('.'),
					comparator: key as FilterOperators,
					value: destructTree[key]
				}
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
		margin-left: 24px;
		padding-left: 0;
	}

	.v-list {
		margin-left: 0px;

		& > :deep(.group) {
			margin-left: 0px;
		}
	}
}
</style>
