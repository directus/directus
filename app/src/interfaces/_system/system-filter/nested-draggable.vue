<template>
	<draggable
        :group="{ name: 'g1' }"
        :list="tree"
        draggable=".row"
        tag="ul"
        item-key="id"
        @change="$emit('change', $event)"
    >
        <template #item="{element}">
            <li class="row">
                <operator-select :element="element" :collection="collection"/>
                <field v-if="isField(element)">

                </field>
                <nested-draggable
                    v-else
                    :tree="element._and || element._or || []"
                    @change="$emit('change', $event)"
                    :collection="collection"
                ></nested-draggable>
            </li>
        </template>
    </draggable>
    <v-button small>Add field</v-button>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';
import Draggable from 'vuedraggable';
import OperatorSelect from './operator-select.vue'
import { Logic, isField } from './system-filter.vue';

export default defineComponent({
    name: 'NestedDraggable',
    components: {
        Draggable,
        OperatorSelect
    },
    emits: ['change', 'input'],
	props: {
		tree: {
			type: Array as PropType<Logic[]>,
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
		

		return { isField };
	},
});
</script>
