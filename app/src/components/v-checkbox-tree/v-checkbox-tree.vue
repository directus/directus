<template>
	<v-list v-model="openSelection" :mandatory="false" @toggle="$emit('group-toggle', $event)">
		<v-checkbox-tree-checkbox
			v-for="choice in choices"
			:key="choice[itemValue]"
			v-model="value"
			:value-combining="valueCombining"
			:search="search"
			:item-text="itemText"
			:item-value="itemValue"
			:item-children="itemChildren"
			:text="choice[itemText]"
			:value="choice[itemValue]"
			:children="choice[itemChildren]"
			:disabled="disabled"
			:show-selection-only="showSelectionOnly"
		/>
	</v-list>
</template>

<script lang="ts">
import { computed, ref, defineComponent, PropType, watch } from 'vue';
import VCheckboxTreeCheckbox from './v-checkbox-tree-checkbox.vue';

export default defineComponent({
	name: 'VCheckboxTree',
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
		showSelectionOnly: {
			type: Boolean,
			default: false,
		},
	},
	emits: ['update:modelValue', 'group-toggle'],
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

		watch(
			() => props.search,
			(newValue) => {
				if (!newValue) return;

				const selection = new Set([...openSelection.value, ...search(newValue, props.choices)]);

				openSelection.value = [...selection];
			},
			{ immediate: true }
		);

		function search(text: string, target: Record<string, any>[]) {
			const selection: string[] = [];

			for (const item of target) {
				if (item[props.itemText].toLowerCase().includes(text.toLowerCase())) {
					selection.push(item[props.itemValue]);
				}

				if (item[props.itemChildren]) {
					selection.push(...search(text, item[props.itemChildren]));
				}
			}

			return selection;
		}

		return { value, openSelection };
	},
});
</script>
