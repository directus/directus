<template>
	<v-list-group v-if="children">
		<template #activator>
			<v-checkbox :label="text" :value="value" v-model="treeValue" />
		</template>

		<v-checkbox-tree-checkbox
			v-for="choice in children"
			:key="choice.value"
			:value-combining="valueCombining"
			v-bind="choice"
			v-model="treeValue"
		/>
	</v-list-group>

	<v-list-item v-else>
		<v-checkbox :label="text" :value="value" v-model="treeValue" />
	</v-list-item>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { Choice } from './types';
import { difference } from 'lodash';

type Delta = {
	added?: number | string;
	removed?: number | string;
};

export default defineComponent({
	name: 'v-checkbox-tree-checkbox',
	props: {
		text: {
			type: String,
			required: true,
		},
		value: {
			type: [String, Number],
			required: true,
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

		const childrenValuesRecursive = computed(() => {
			const values: (string | number)[] = [];

			getChildrenValuesRecursive(props.children);

			return values;

			function getChildrenValuesRecursive(children: Choice['children']) {
				if (!children) return;

				for (const child of children) {
					values.push(child.value);

					if (child.children) {
						getChildrenValuesRecursive(child.children);
					}
				}
			}
		});

		const treeValue = computed({
			get() {
				return props.modelValue || [];
			},
			set(newValue: (string | number)[]) {
				const added = difference(newValue, props.modelValue)[0];
				const removed = difference(props.modelValue, newValue)[0];

				if (props.children) {
					switch (props.valueCombining) {
						case 'all':
							return emitAll(newValue, { added, removed });
					}
				}

				emitValue(newValue);
			},
		});

		return { treeValue, childrenValuesRecursive };

		function emitAll(rawValue: (string | number)[], { added, removed }: Delta) {
			// When enabling the group level
			if (added === props.value) {
				const newValue = [
					...rawValue.filter((val) => val !== props.value && childrenValues.value.includes(val) === false),
					...childrenValuesRecursive.value,
					props.value,
				];

				return emitValue(newValue);
			}

			// When disabling the group level
			if (removed === props.value) {
				const newValue = rawValue.filter(
					(val) => val !== props.value && childrenValuesRecursive.value.includes(val) === false
				);
				return emitValue(newValue);
			}

			// When all children are clicked
			if (childrenValues.value.every((childVal) => rawValue.includes(childVal))) {
				const newValue = [
					...rawValue.filter((val) => val !== props.value && childrenValuesRecursive.value.includes(val) === false),
					...childrenValuesRecursive.value,
					props.value,
				];

				return emitValue(newValue);
			}

			const newValue = rawValue.filter((val) => val !== props.value);
			return emitValue(newValue);
		}

		function emitValue(newValue: (string | number)[]) {
			emit('update:modelValue', newValue);
		}
	},
});
</script>
