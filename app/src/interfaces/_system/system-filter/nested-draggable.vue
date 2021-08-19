<template>
	<draggable
        :group="{ name: 'g1' }"
        :list="tree"
        draggable=".row"
        item-key="id"
        tag="ul"
        class="group"
        @change="$emit('change', $event)"
    >
        <template #item="{element, index}">
            <li class="row">
                <v-list-item class="header" block>
                    <div class="header-start">
                        <v-list-item-icon>
                            <v-icon :name="element.type === 'logic'? 'rule' : 'extension'"></v-icon>
                        </v-list-item-icon>
                        <v-select
                            inline
                            :full-width="false"
                            :model-value="element.name"
                            :items="selectOptions"
                            itemText="name"
                            itemValue="key"
                            :mandatory="false"
                            :groupsClickable="true"
                            @group-clicked="onToggle"
                            @update:modelValue="updateValue($event, index)"
                        />
                    </div>
                    <v-icon name="expand_more" @click="open(index)"></v-icon>
                </v-list-item>
                
                <template v-if="active.has(index)">
                    <field-input v-if="element.type === 'field'" :field="element" :collection="collection" />
                    <nested-draggable
                        v-else
                        :tree="element.values"
                        @change="$emit('change', $event)"
                        :collection="collection"
                    />
                </template>
            </li>
        </template>
    </draggable>
    <v-button class="add" small @click="addField">Add field</v-button>

</template>

<script lang="ts">
import { GroupableInstance, useGroupable } from '@/composables/groupable/groupable';
import useFieldTreeAdvanced from '@/composables/use-field-tree-advanced';
import { computed, defineComponent, PropType, ref, toRefs, watch } from 'vue';
import FieldInput from './field-input.vue'
import Draggable from 'vuedraggable';
import { Logic, LogicOperators, FilterOperators, FilterTree, Field } from './system-filter.vue';

export default defineComponent({
    name: 'NestedDraggable',
    components: {
        Draggable,
        FieldInput
    },
    emits: ['change', 'input'],
	props: {
		tree: {
			type: Array as PropType<FilterTree>,
			default: null,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
        collection: {
            type: String,
            required: true
        }
	},
	setup(props) {
		const {collection, tree} = toRefs(props)
        const {treeList, loadFieldRelations, getField} = useFieldTreeAdvanced(collection)

        const active = ref<Set<number>>(new Set())

        function open(index: number) {
            if(active.value.has(index)) {
                active.value.delete(index)
            } else {
                active.value.add(index)
            }
        }

        const selectOptions = computed(() => [
            {
                name: 'AND',
                key: '_and'
            },
            {
                name: 'OR',
                key: '_or'
            },
            ...treeList.value,
        ])

        watch(tree, (newTree) => {
            newTree.forEach(field => {
                if(field.type === 'field') {
                    loadFieldRelations(field.name)
                }
            })
        })

		return { selectOptions, onToggle, updateValue, addField, active, open };

        function updateValue(newKey: string, index: number) {
            let element = tree.value[index]
            if(newKey.startsWith('_')) {
                if(element.type === 'logic') {
                    element.name = newKey as LogicOperators
                } else {
                    tree.value[index] = {
                        type: 'logic',
                        name: newKey as LogicOperators,
                        values: []
                    }
                }
            } else {
                if(element.type === 'field') {
                    element.name = newKey
                } else {
                    tree.value[index] = {
                        type: 'field',
                        name: newKey,
                        comparator: '_eq',
                        value: ''
                    }
                }
            }
        }

        function onToggle(item: GroupableInstance) {
			const field = getField(String(item.value))

			field?.children?.forEach(child => {
				console.log(child.key)
				loadFieldRelations(child.key)
			})
		}

        function addField() {
            props.tree.push({
                type: 'logic',
                name: '_and',
                values: []
            })
        }
	},
});
</script>

<style lang="scss" scoped>

.header {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.header-start {
    display: flex;
    align-items: center;
}

.row {
    margin-bottom: 10px;
}

.group {
    margin-top: 10px;
}

.add {
    margin-left: 24px;
}
</style>