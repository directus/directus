<template>
	<v-list-group v-if="children">
		<template #activator>
			<v-checkbox
				:indeterminate="groupIndeterminateState"
				:checked="groupCheckedStateOverride"
				:label="text"
				:value="value"
				v-model="treeValue"
			/>
		</template>

		<v-checkbox-tree-checkbox
			v-for="choice in children"
			:key="choice.value"
			:value-combining="valueCombining"
			:checked="childrenCheckedStateOverride"
			v-bind="choice"
			v-model="treeValue"
		/>
	</v-list-group>

	<v-list-item v-else>
		<v-checkbox :checked="checked" :label="text" :value="value" v-model="treeValue" />
	</v-list-item>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { Choice } from './types';
import { difference } from 'lodash';

type Delta = {
	added?: (number | string)[];
	removed?: (number | string)[];
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
			type: Array as PropType<(string | number)[]>,
			default: () => [],
		},
		valueCombining: {
			type: String as PropType<'all' | 'branch' | 'leaf' | 'indeterminate'>,
			required: true,
		},
		checked: {
			type: Boolean,
			default: null,
		},
	},
	setup(props, { emit }) {
		const childrenValues = computed(() => props.children?.map((child) => child.value) || []);

		const treeValue = computed({
			get() {
				return props.modelValue || [];
			},
			set(newValue: (string | number)[]) {
				const added = difference(newValue, props.modelValue);
				const removed = difference(props.modelValue, newValue);

				if (props.children) {
					switch (props.valueCombining) {
						case 'all':
							return emitAll(newValue, { added, removed });
						case 'branch':
							return emitBranch(newValue, { added, removed });
						default:
							return emitValue(newValue);
					}
				}

				emitValue(newValue);
			},
		});

		const groupCheckedStateOverride = computed(() => {
			if (props.checked !== null) return props.checked;
			if (props.valueCombining === 'all') return null;
		});

		const groupIndeterminateState = computed(() => {
			const allChildrenValues = getRecursiveChildrenValues('all');

			if (props.valueCombining === 'all' || props.valueCombining === 'branch') {
				return (
					allChildrenValues.some((childVal) => props.modelValue.includes(childVal)) &&
					props.modelValue.includes(props.value) === false
				);
			}
		});

		const childrenCheckedStateOverride = computed(() => {
			if (props.checked !== null) return props.checked;
			if (props.valueCombining === 'all') return null;

			if (props.valueCombining === 'branch') {
				if (props.modelValue.includes(props.value)) return true;
			}
		});

		return { groupCheckedStateOverride, childrenCheckedStateOverride, treeValue, groupIndeterminateState };

		function emitAll(rawValue: (string | number)[], { added, removed }: Delta) {
			const childrenValuesRecursive = getRecursiveChildrenValues('all');

			// When enabling the group level
			if (added?.[0] === props.value) {
				const newValue = [
					...rawValue.filter((val) => val !== props.value && childrenValues.value.includes(val) === false),
					...childrenValuesRecursive,
					props.value,
				];

				return emitValue(newValue);
			}

			// When disabling the group level
			if (removed?.[0] === props.value) {
				const newValue = rawValue.filter(
					(val) => val !== props.value && childrenValuesRecursive.includes(val) === false
				);
				return emitValue(newValue);
			}

			// When all children are clicked
			if (childrenValues.value.every((childVal) => rawValue.includes(childVal))) {
				const newValue = [
					...rawValue.filter((val) => val !== props.value && childrenValuesRecursive.includes(val) === false),
					...childrenValuesRecursive,
					props.value,
				];

				return emitValue(newValue);
			}

			const newValue = rawValue.filter((val) => val !== props.value);
			return emitValue(newValue);
		}

		function emitBranch(rawValue: (string | number)[], { added, removed }: Delta) {
			const allChildrenRecursive = getRecursiveChildrenValues('all');

			// When clicking on an individual item in the enabled group
			if (
				(props.modelValue.includes(props.value) || props.checked === true) &&
				added &&
				childrenValues.value.includes(added?.[0])
			) {
				const newValue = [
					...rawValue.filter((val) => val !== props.value && val !== added?.[0]),
					...childrenValues.value.filter((childVal) => childVal !== added?.[0]),
				];

				return emitValue(newValue);
			}

			// When a childgroup is modified
			if (
				props.modelValue.includes(props.value) &&
				allChildrenRecursive.some((childVal) => rawValue.includes(childVal))
			) {
				const newValue = [
					...rawValue.filter((val) => val !== props.value),
					...(props.children || [])
						.filter((child) => {
							if (!child.children) return true;

							const childNestedValues = getRecursiveChildrenValues('all', child.children);
							return rawValue.some((rawVal) => childNestedValues.includes(rawVal)) === false;
						})
						.map((child) => child.value),
				];

				return emitValue(newValue);
			}

			// When enabling the group level
			if (added?.includes(props.value)) {
				const newValue = [
					...rawValue.filter((val) => val !== props.value && allChildrenRecursive.includes(val) === false),
					props.value,
				];

				return emitValue(newValue);
			}

			// When disabling the group level
			if (removed?.includes(props.value)) {
				const newValue = rawValue.filter((val) => val !== props.value && allChildrenRecursive.includes(val) === false);
				return emitValue(newValue);
			}

			// When all children are clicked
			if (childrenValues.value.every((childVal) => rawValue.includes(childVal))) {
				const newValue = [
					...rawValue.filter((val) => val !== props.value && allChildrenRecursive.includes(val) === false),
					props.value,
				];

				return emitValue(newValue);
			}

			return emitValue(rawValue);
		}

		function emitValue(newValue: (string | number)[]) {
			emit('update:modelValue', newValue);
		}

		function getRecursiveChildrenValues(
			mode: 'all' | 'branch' | 'leaf',
			children: Choice['children'] = props.children
		) {
			const values: (string | number)[] = [];

			getChildrenValuesRecursive(children);

			return values;

			function getChildrenValuesRecursive(children: Choice['children']) {
				if (!children) return;

				for (const child of children) {
					if (mode === 'all') {
						values.push(child.value);
					}

					if (mode === 'branch' && child.children) {
						values.push(child.value);
					}

					if (mode === 'leaf' && !child.children) {
						values.push(child.value);
					}

					if (child.children) {
						getChildrenValuesRecursive(child.children);
					}
				}
			}
		}
	},
});
</script>
