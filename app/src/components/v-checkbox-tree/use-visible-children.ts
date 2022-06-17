import { computed, Ref } from 'vue';

export function useVisibleChildren(
	search: Ref<string>,
	modelValue: Ref<(string | number)[]>,
	children: Ref<Record<string, any>[]>,
	showSelectionOnly: Ref<boolean>,
	itemText: Ref<string>,
	itemValue: Ref<string>,
	itemChildren: Ref<string>,
	parentValue: Ref<string | number>,
	value: Ref<string | number>
) {
	const visibleChildrenValues = computed(() => {
		let options = children.value || [];

		if (search.value) {
			options = options.filter(
				(child) =>
					child[itemText.value].toLowerCase().includes(search.value.toLowerCase()) ||
					childrenHaveSearchMatch(child[itemChildren.value])
			);
		}

		if (showSelectionOnly.value) {
			options = options.filter(
				(child) =>
					modelValue.value.includes(child[itemValue.value]) ||
					childrenHaveValueMatch(child[itemChildren.value]) ||
					modelValue.value.includes(parentValue.value) ||
					modelValue.value.includes(value.value)
			);
		}

		return options.map((child) => child[itemValue.value]);

		function childrenHaveSearchMatch(children: Record<string, any>[] | undefined): boolean {
			if (!children) return false;
			return children.some(
				(child) =>
					child[itemText.value].toLowerCase().includes(search.value.toLowerCase()) ||
					childrenHaveSearchMatch(child[itemChildren.value])
			);
		}

		function childrenHaveValueMatch(children: Record<string, any>[] | undefined): boolean {
			if (!children) return false;
			return children.some(
				(child) =>
					modelValue.value.includes(child[itemValue.value]) || childrenHaveValueMatch(child[itemChildren.value])
			);
		}
	});

	return { visibleChildrenValues };
}
