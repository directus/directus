<template>
	<div class="system-filter">
		<!-- <nested-draggable :tree="tree" @change="updateTree" :collection="collection">
			
		</nested-draggable> -->
		<v-select v-model="selected" :items="treeList" itemText="name" itemValue="key" :mandatory="false" :groupsClickable="true" @group-toggle="onToggle"></v-select>

	</div>
</template>

<script lang="ts">
import { GroupableInstance } from '@/composables/groupable/groupable';
import useFieldTreeAdvanced from '@/composables/use-field-tree-advanced';
import collection from '@/displays/collection';
import { defineComponent, computed, inject, ref, PropType, toRefs } from 'vue';
import NestedDraggable from './nested-draggable.vue'

export type Logic = Partial<Record<LogicOperators, (Logic | Field)[]>>

export type Field = {
	[key: string]: Partial<Record<FilterOperators, any>> | Field
}
export const logicOperators = ['and', 'or'] as const
export type LogicOperators = `_${typeof logicOperators[number]}`


export const filterOperators = ['eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in', 'nin', 'null', 'nnull', 'contains', 'ncontains', 'starts_with', 'nstarts_with', 'ends_with', 'nends_with', 'between', 'nbetween', 'empty', 'nempty'] as const
export type FilterOperators = `_${typeof filterOperators[number]}`

export function isField(obj: Record<string, any>) {
	return Object.keys(obj)[0].startsWith('_') === false
}

export default defineComponent({
	components: {
		NestedDraggable
	},
	props: {
		value: {
			type: Object as PropType<Logic[]>,
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

		const tree = ref<Logic[]>([
			{
				"_or": [
					{
						"_and": [
							{
								"owner": {
									"_eq": "$CURRENT_USER",
								}
							},
							{
								"status": {
									"_in": ["published", "draft"]
								}
							}
						]
					},
					{
						"_and": [
							{
								"owner": {
									"_neq": "$CURRENT_USER"
								}
							},
							{
								"status": {
									"_in": ["published"]
								}
							}
						]
					}
				]
			}
		])

		const innerValue = computed({
			get() {
				return props.value
			},
			set(newVal: Logic[]) {
				emit('input', newVal)
			}
		})

		const selected = ref("")

		const {treeList, tree: myTree, loadFieldRelations, getField} = useFieldTreeAdvanced(collection)

		return { tree, updateTree, innerValue, treeList, myTree, selected, onToggle };

		function onToggle(item: GroupableInstance) {
			const field = getField(String(item.value))

			field?.children?.forEach(child => {
				loadFieldRelations(child.key)
			})
		}

		function updateTree(newVal: any) {
			// emit('input', tree.value)
		}
	},
});
</script>

<style lang="scss" scoped>
.system-filter {
	width: 300px;
}
</style>
