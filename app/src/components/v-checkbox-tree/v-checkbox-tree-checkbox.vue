<template>
	<v-list-group v-if="children" v-show="groupShown" :value="value" :open="groupOpen" arrow-placement="before">
		<template #activator>
			<v-checkbox
				v-model="treeValue"
				:indeterminate="groupIndeterminateState"
				:checked="groupCheckedStateOverride"
				:label="text"
				:value="value"
				:disabled="disabled"
			>
				<v-highlight :text="text" :query="search" />
			</v-checkbox>
		</template>

		<v-checkbox-tree-checkbox
			v-for="choice in children"
			:key="choice[itemValue]"
			v-model="treeValue"
			:value-combining="valueCombining"
			:checked="childrenCheckedStateOverride"
			:hidden="visibleChildrenValues.includes(choice[itemValue]) === false"
			:search="search"
			:item-text="itemText"
			:item-value="itemValue"
			:item-children="itemChildren"
			:text="choice[itemText]"
			:value="choice[itemValue]"
			:children="choice[itemChildren]"
			:disabled="disabled"
			:show-selection-only="showSelectionOnly"
			:parent-value="value"
		/>
	</v-list-group>

	<v-list-item v-else-if="!children" v-show="!hidden" class="item">
		<v-checkbox v-model="treeValue" :disabled="disabled" :checked="checked" :label="text" :value="value">
			<v-highlight :text="text" :query="search" />
		</v-checkbox>
	</v-list-item>
</template>

<script lang="ts">
import { defineComponent, computed, PropType } from 'vue';
import { difference } from 'lodash';

type Delta = {
	added?: (number | string)[];
	removed?: (number | string)[];
};

export default defineComponent({
	name: 'VCheckboxTreeCheckbox',
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
			type: Array as PropType<Record<string, any>[]>,
			default: null,
		},
		modelValue: {
			type: Array as PropType<(string | number)[]>,
			default: () => [],
		},
		valueCombining: {
			type: String as PropType<'all' | 'branch' | 'leaf' | 'indeterminate' | 'exclusive'>,
			required: true,
		},
		checked: {
			type: Boolean,
			default: null,
		},
		search: {
			type: String,
			default: null,
		},
		hidden: {
			type: Boolean,
			default: false,
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
		parentValue: {
			type: [String, Number],
			default: null,
		},
	},
	emits: ['update:modelValue'],
	setup(props, { emit }) {
		const visibleChildrenValues = computed(() => {
			let options = props.children || [];

			if (props.search) {
				options = options.filter(
					(child) =>
						child[props.itemText].toLowerCase().includes(props.search.toLowerCase()) ||
						childrenHaveSearchMatch(child[props.itemChildren])
				);
			}

			if (props.showSelectionOnly) {
				options = options.filter(
					(child) =>
						props.modelValue.includes(child[props.itemValue]) ||
						childrenHaveValueMatch(child[props.itemChildren]) ||
						props.modelValue.includes(props.parentValue) ||
						props.modelValue.includes(props.value)
				);
			}

			return options.map((child) => child[props.itemValue]);

			function childrenHaveSearchMatch(children: Record<string, any>[] | undefined): boolean {
				if (!children) return false;
				return children.some(
					(child) =>
						child[props.itemText].toLowerCase().includes(props.search.toLowerCase()) ||
						childrenHaveSearchMatch(child[props.itemChildren])
				);
			}

			function childrenHaveValueMatch(children: Record<string, any>[] | undefined): boolean {
				if (!children) return false;
				return children.some(
					(child) =>
						props.modelValue.includes(child[props.itemValue]) || childrenHaveValueMatch(child[props.itemChildren])
				);
			}
		});

		const groupShown = computed(() => {
			if (props.showSelectionOnly === true && props.modelValue.includes(props.value)) {
				return true;
			}

			return visibleChildrenValues.value.length > 0;
		});

		const groupOpen = computed(() => {
			if (props.showSelectionOnly === true) {
				return visibleChildrenValues.value.length > 0;
			}

			return typeof props.search === 'string' && props.search.length > 0;
		});

		const childrenValues = computed(() => props.children?.map((child) => child[props.itemValue]) || []);

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
						case 'leaf':
							return emitLeaf(newValue, { added, removed });
						case 'indeterminate':
							return emitIndeterminate(newValue, { added, removed });
						case 'exclusive':
							return emitExclusive(newValue, { added, removed });
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

			if (props.valueCombining === 'leaf') {
				const leafChildrenRecursive = getRecursiveChildrenValues('leaf');
				return leafChildrenRecursive.every((childVal) => props.modelValue.includes(childVal));
			}

			return null;
		});

		const groupIndeterminateState = computed(() => {
			const allChildrenValues = getRecursiveChildrenValues('all');

			if (props.valueCombining === 'all' || props.valueCombining === 'branch') {
				return (
					allChildrenValues.some((childVal) => props.modelValue.includes(childVal)) &&
					props.modelValue.includes(props.value) === false
				);
			}

			if (props.valueCombining === 'indeterminate') {
				return (
					allChildrenValues.some((childVal) => props.modelValue.includes(childVal)) &&
					allChildrenValues.every((childVal) => props.modelValue.includes(childVal)) === false
				);
			}

			if (props.valueCombining === 'leaf') {
				const leafChildrenRecursive = getRecursiveChildrenValues('leaf');
				return (
					leafChildrenRecursive.some((childVal) => props.modelValue.includes(childVal)) &&
					leafChildrenRecursive.every((childVal) => props.modelValue.includes(childVal)) === false
				);
			}

			if (props.valueCombining === 'exclusive') {
				return allChildrenValues.some((childVal) => props.modelValue.includes(childVal));
			}

			return null;
		});

		const childrenCheckedStateOverride = computed(() => {
			if (props.checked !== null) return props.checked;
			if (props.valueCombining === 'all') return null;

			if (props.valueCombining === 'branch') {
				if (props.modelValue.includes(props.value)) return true;
			}

			return null;
		});

		return {
			groupCheckedStateOverride,
			childrenCheckedStateOverride,
			treeValue,
			groupIndeterminateState,
			visibleChildrenValues,
			groupShown,
			groupOpen,
		};

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

			// Note: Added/removed is a tad confusing here, as an item that gets added to the array of
			// selected items can immediately be negated by the logic below, as it's potentially
			// replaced by the parent item's value

			// When clicking on an individual item in the enabled group
			if (
				(props.modelValue.includes(props.value) || props.checked === true) &&
				added &&
				added.length === 1 &&
				childrenValues.value.includes(added[0])
			) {
				const newValue = [
					...rawValue.filter((val) => val !== props.value && val !== added[0]),
					...childrenValues.value.filter((childVal) => childVal !== added[0]),
				];

				return emitValue(newValue);
			}

			// When a childgroup is modified
			if (
				props.modelValue.includes(props.value) &&
				allChildrenRecursive.some((childVal) => rawValue.includes(childVal))
			) {
				const childThatContainsSelection = props.children.find((child) => {
					const childNestedValues = getRecursiveChildrenValues('all', child[props.itemChildren]);
					return rawValue.some((rawVal) => childNestedValues.includes(rawVal)) === true;
				});

				const newValue = [
					...rawValue.filter((val) => val !== props.value),
					...(props.children || [])
						.filter((child) => {
							if (!child[props.itemChildren]) return true;
							return child[props.itemValue] !== childThatContainsSelection?.[props.itemValue];
						})
						.map((child) => child[props.itemValue]),
					...(childThatContainsSelection?.[props.itemChildren] ?? [])
						.filter((grandChild: Record<string, any>) => {
							const childNestedValues = getRecursiveChildrenValues('all', grandChild[props.itemChildren]);
							return rawValue.some((rawVal) => childNestedValues.includes(rawVal)) === false;
						})
						.map((grandChild: Record<string, any>) => grandChild[props.itemValue]),
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

		function emitLeaf(rawValue: (string | number)[], { added }: Delta) {
			const allChildrenRecursive = getRecursiveChildrenValues('all');
			const leafChildrenRecursive = getRecursiveChildrenValues('leaf');

			// When enabling the group level
			if (added?.includes(props.value)) {
				if (leafChildrenRecursive.every((childVal) => rawValue.includes(childVal))) {
					const newValue = rawValue.filter(
						(val) => val !== props.value && allChildrenRecursive.includes(val) === false
					);
					return emitValue(newValue);
				} else {
					const newValue = [
						...rawValue.filter((val) => val !== props.value && allChildrenRecursive.includes(val) === false),
						...leafChildrenRecursive,
					];

					return emitValue(newValue);
				}
			}

			return emitValue(rawValue);
		}

		function emitIndeterminate(rawValue: (string | number)[], { added, removed }: Delta) {
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

			// When a child value is clicked
			if (childrenValues.value.some((childVal) => rawValue.includes(childVal))) {
				const newValue = [...rawValue.filter((val) => val !== props.value), props.value];

				return emitValue(newValue);
			}

			// When no children are clicked
			if (childrenValues.value.every((childVal) => rawValue.includes(childVal) === false)) {
				return emitValue(rawValue.filter((val) => val !== props.value));
			}

			return emitValue(rawValue);
		}

		function emitExclusive(rawValue: (string | number)[], { added }: Delta) {
			const childrenValuesRecursive = getRecursiveChildrenValues('all');

			// When enabling the group level
			if (added?.[0] === props.value) {
				const newValue = [
					...rawValue.filter((val) => val !== props.value && childrenValuesRecursive.includes(val) === false),
					props.value,
				];

				return emitValue(newValue);
			}

			// When a child value is clicked
			if (childrenValuesRecursive.some((childVal) => rawValue.includes(childVal))) {
				const newValue = [...rawValue.filter((val) => val !== props.value)];
				return emitValue(newValue);
			}

			return emitValue(rawValue);
		}

		function emitValue(newValue: (string | number)[]) {
			emit('update:modelValue', newValue);
		}

		function getRecursiveChildrenValues(
			mode: 'all' | 'branch' | 'leaf',
			children: Record<string, any>[] = props.children
		) {
			const values: (string | number)[] = [];

			getChildrenValuesRecursive(children);

			return values;

			function getChildrenValuesRecursive(children: Record<string, any>[]) {
				if (!children) return;

				for (const child of children) {
					if (mode === 'all') {
						values.push(child[props.itemValue]);
					}

					if (mode === 'branch' && child[props.itemChildren]) {
						values.push(child[props.itemValue]);
					}

					if (mode === 'leaf' && !child[props.itemChildren]) {
						values.push(child[props.itemValue]);
					}

					if (child[props.itemChildren]) {
						getChildrenValuesRecursive(child[props.itemChildren]);
					}
				}
			}
		}
	},
});
</script>

<style scoped>
.item {
	padding-left: 32px !important;
}
</style>
