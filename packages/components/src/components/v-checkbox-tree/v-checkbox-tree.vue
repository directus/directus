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
			:hidden="visibleChildrenValues.includes(choice[itemValue]) === false"
			:value="choice[itemValue]"
			:children="choice[itemChildren]"
			:disabled="disabled"
			:show-selection-only="showSelectionOnly"
		/>
	</v-list>
</template>

<script lang="ts">
export default {
	name: 'VCheckboxTree',
};
</script>

<script setup lang="ts">
import { computed, ref, watch, toRefs } from 'vue';
import { useVisibleChildren } from './use-visible-children';
import VCheckboxTreeCheckbox from './v-checkbox-tree-checkbox.vue';

interface Props {
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
	/** Show only the selected choices */
	showSelectionOnly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	choices: () => [],
	modelValue: () => [],
	valueCombining: 'all',
	search: null,
	itemText: 'text',
	itemValue: 'value',
	itemChildren: 'children',
	disabled: false,
	showSelectionOnly: false,
});

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

const { search, modelValue, showSelectionOnly, itemText, itemValue, itemChildren, choices } = toRefs(props);

const { visibleChildrenValues } = useVisibleChildren(
	search,
	modelValue,
	choices,
	showSelectionOnly,
	itemText,
	itemValue,
	itemChildren,
	fakeParentValue,
	fakeValue
);

let showAllSelection: (string | number)[] = [];
const openSelection = ref<(string | number)[]>([]);

watch(
	() => props.search,
	(newValue) => {
		if (!newValue) return;

		const selection = new Set([...openSelection.value, ...searchChoices(newValue, props.choices)]);

		openSelection.value = [...selection];
	},
	{ immediate: true }
);

watch(showSelectionOnly, (isSelectionOnly) => {
	if (isSelectionOnly) {
		const selection = new Set([...openSelection.value, ...findSelectedChoices(props.choices, value.value)]);

		showAllSelection = openSelection.value;
		openSelection.value = [...selection];
	} else {
		openSelection.value = [...showAllSelection];
	}
});

function searchChoices(text: string, target: Record<string, any>[]) {
	const selection: string[] = [];

	for (const item of target) {
		if (item[props.itemText].toLowerCase().includes(text.toLowerCase())) {
			selection.push(item[props.itemValue]);
		}

		if (item[props.itemChildren]) {
			selection.push(...searchChoices(text, item[props.itemChildren]));
		}
	}

	return selection;
}

function findSelectedChoices(choices: Record<string, any>[], checked: (string | number)[]) {
	function selectedChoices(item: Record<string, any>): (string | number)[] {
		if (!item[props.itemValue]) return [];
		let result: (string | number)[] = [];

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
