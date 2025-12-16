<script setup lang="ts">
import { remove as removeDiacritics } from 'diacritics';
import { computed, ref, toRefs, watch } from 'vue';
import { useVisibleChildren } from './use-visible-children';
import VCheckboxTreeCheckbox from './v-checkbox-tree-checkbox.vue';
import VList from '@/components/v-list.vue';

const props = withDefaults(
	defineProps<{
		/** The choices that will be rendered as checkboxes */
		choices?: Record<string, any>[];
		/** Which choices should be shown as selected, depending on their value */
		modelValue?: (string | number)[];
		valueCombining?: 'all' | 'branch' | 'leaf' | 'indeterminate' | 'exclusive';
		/** Will highlight every text that matches the given search */
		search?: string | null;
		/** Which key in choices is used to display the text */
		itemText?: string;
		/** Which key in choices is used to model the active state */
		itemValue?: string;
		/** Which key in choices is used to render children */
		itemChildren?: string;
		/** Disables any interaction */
		disabled?: boolean;
		/** Set the non-editable state for the input */
		nonEditable?: boolean;
		/** Show only the selected choices */
		showSelectionOnly?: boolean;
		/** Opens all groups included in the array. `[]` collapses all groups. Ignored if not an array. */
		openGroups?: string[] | null;
	}>(),
	{
		choices: () => [],
		modelValue: () => [],
		valueCombining: 'all',
		search: null,
		itemText: 'text',
		itemValue: 'value',
		itemChildren: 'children',
		disabled: false,
		nonEditable: false,
		showSelectionOnly: false,
	},
);

const emit = defineEmits(['update:modelValue', 'group-toggle']);

const value = computed({
	get() {
		return props.modelValue || [];
	},
	set(newValue: (string | number)[]) {
		emit('update:modelValue', newValue);
	},
});

const fakeValue = ref('');
const fakeParentValue = ref('');

const { modelValue, showSelectionOnly, itemText, itemValue, itemChildren, choices } = toRefs(props);

const normalizedSearch = computed(() => (props.search !== null ? removeDiacritics(props.search).toLowerCase() : null));

const { visibleChildrenValues } = useVisibleChildren(
	normalizedSearch,
	modelValue,
	choices,
	showSelectionOnly,
	itemText,
	itemValue,
	itemChildren,
	fakeParentValue,
	fakeValue,
);

let showAllSelection: (string | number)[] = [];
const manualOpenSelection = ref<(string | number)[]>([]);

const searchOpenSelection = computed(() =>
	normalizedSearch.value ? searchChoices(normalizedSearch.value, props.choices) : [],
);

const openSelection = computed({
	get() {
		if (Array.isArray(props.openGroups)) return props.openGroups;
		return Array.from(new Set([...manualOpenSelection.value, ...searchOpenSelection.value]));
	},
	set(newValue) {
		manualOpenSelection.value = newValue;
	},
});

watch(showSelectionOnly, (isSelectionOnly) => {
	if (isSelectionOnly) {
		const selection = new Set([...manualOpenSelection.value, ...findSelectedChoices(props.choices, value.value)]);

		showAllSelection = manualOpenSelection.value;
		manualOpenSelection.value = [...selection];
	} else {
		manualOpenSelection.value = [...showAllSelection];
	}
});

function searchChoices(text: string, target: Record<string, any>[], tree: string[] = []) {
	const selection: string[] = [];

	for (const item of target) {
		const normalizedItemText = removeDiacritics(item[props.itemText]).toLowerCase();

		if (normalizedItemText.includes(text)) {
			selection.push(...tree, item[props.itemValue]);
		}

		if (item[props.itemChildren]) {
			selection.push(...searchChoices(text, item[props.itemChildren], [...tree, item[props.itemValue]]));
		}
	}

	return selection;
}

function findSelectedChoices(choices: Record<string, any>[], checked: (string | number)[]) {
	function selectedChoices(item: Record<string, any>): (string | number)[] {
		if (!item[props.itemValue]) return [];
		const result: (string | number)[] = [];

		const itemValue: string | number = item[props.itemValue];
		if (checked.includes(itemValue)) result.push(itemValue);

		if (item[props.itemChildren]) {
			const children = item[props.itemChildren];

			if (Array.isArray(children) && children.length > 0) {
				const nestedResult = children.flatMap((child) => selectedChoices(child));

				if (nestedResult.length > 0) {
					result.push(...nestedResult, itemValue);
				}
			}
		}

		return result;
	}

	return choices.flatMap((item) => selectedChoices(item));
}
</script>

<template>
	<VList v-model="openSelection" role="group" :mandatory="false" @toggle="$emit('group-toggle', $event)">
		<VCheckboxTreeCheckbox
			v-for="choice in choices"
			:key="choice[itemValue]"
			v-model="value"
			:value-combining="valueCombining"
			:search="normalizedSearch"
			:item-text="itemText"
			:item-value="itemValue"
			:item-children="itemChildren"
			:text="choice[itemText]"
			:hidden="visibleChildrenValues.includes(choice[itemValue]) === false"
			:value="choice[itemValue]"
			:children="choice[itemChildren]"
			:disabled="disabled || choice.disabled"
			:non-editable="nonEditable"
			:show-selection-only="showSelectionOnly"
		/>
	</VList>
</template>
