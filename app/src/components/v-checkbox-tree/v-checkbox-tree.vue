<template>
	<v-list :mandatory="false" v-model="openSelection">
		<v-checkbox-tree-checkbox
			v-for="choice in choices"
			:key="choice.value"
			:value-combining="valueCombining"
			:search="search"
			v-bind="choice"
			v-model="value"
		/>
	</v-list>
</template>

<script lang="ts">
import { computed, ref, defineComponent, PropType } from 'vue';
import { Choice } from './types';
import VCheckboxTreeCheckbox from './v-checkbox-tree-checkbox.vue';

export default defineComponent({
	name: 'v-checkbox-tree',
	components: { VCheckboxTreeCheckbox },
	props: {
		choices: {
			type: Array as PropType<Choice[]>,
			default: () => [],
		},
		modelValue: {
			type: Array as PropType<string[]>,
			default: null,
		},
		valueCombining: {
			type: String as PropType<'all' | 'branch' | 'leaf' | 'indeterminate'>,
			default: 'all',
		},
		search: {
			type: String,
			default: null,
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

		const openSelection = ref<string[]>([]);

		return { value, openSelection };
	},
});
</script>
