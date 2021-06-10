<template>
	<v-list-group v-if="children">
		<template #activator>
			<v-checkbox :label="text" :value="value" v-model="treeValue" />
		</template>

		<v-checkbox-tree-checkbox v-for="choice in children" :key="choice.value" v-bind="choice" v-model="treeValue" />
	</v-list-group>

	<v-list-item v-else>
		<v-checkbox :label="text" :value="value" v-model="treeValue" />
	</v-list-item>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { Choice } from './types';

export default defineComponent({
	name: 'v-checkbox-tree-checkbox',
	props: {
		text: {
			type: String,
			required: true,
		},
		value: {
			type: [String, Number, Boolean],
			default: undefined,
		},
		children: {
			type: Array as PropType<Choice[]>,
			default: null,
		},
		modelValue: {
			type: Array as PropType<string[]>,
			default: () => [],
		},
		valueCombining: {
			type: String as PropType<'all' | 'branch' | 'leaf' | 'indeterminate'>,
			required: true,
		},
	},
	setup(props, { emit }) {
		const childrenValues = computed(() => props.children?.map((child) => child.value) || []);

		const treeValue = computed({
			get() {
				return props.modelValue || [];
			},
			set(newValue: string[]) {
				if (props.children) {
				} else {
					emit('update:modelValue', newValue);
				}
			},
		});

		return { treeValue };
	},
});
</script>
