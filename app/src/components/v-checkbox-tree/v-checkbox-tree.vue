<template>
	<v-list :mandatory="false" v-model="openSelection">
		<v-checkbox-tree-checkbox
			v-for="choice in choices"
			:key="choice[itemValue]"
			:value-combining="valueCombining"
			:search="search"
			:item-text="itemText"
			:item-value="itemValue"
			:item-children="itemChildren"
			:text="choice[itemText]"
			:value="choice[itemValue]"
			:children="choice[itemChildren]"
			:disabled="disabled"
			v-model="value"
		/>
	</v-list>
</template>

<script lang="ts">
import { computed, ref, defineComponent, PropType } from 'vue';
import VCheckboxTreeCheckbox from './v-checkbox-tree-checkbox.vue';

export default defineComponent({
	name: 'v-checkbox-tree',
	components: { VCheckboxTreeCheckbox },
	props: {
		choices: {
			type: Array as PropType<Record<string, any>[]>,
			default: () => [],
		},
		modelValue: {
			type: Array as PropType<string[]>,
			default: null,
		},
		valueCombining: {
			type: String as PropType<'all' | 'branch' | 'leaf' | 'indeterminate' | 'exclusive'>,
			default: 'all',
		},
		search: {
			type: String,
			default: null,
		},
		itemText: {
			type: String,
			default: 'text',
		},
		itemValue: {
			type: String,
			default: 'value',
		},
		itemChildren: {
			type: String,
			default: 'children',
		},
		disabled: {
			type: Boolean,
			default: false,
		},
	},
	setup(props, { emit }) {
		const value = computed({
			get() {
				return props.modelValue || [];
			},
			set(newValue: string[]) {
				emit('update:modelValue', newValue);
			},
		});

		const openSelection = ref<(string | number)[]>([]);

		return { value, openSelection };
	},
});
</script>
