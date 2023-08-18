import { computed, Ref } from 'vue';
import { remove as removeDiacritics } from 'diacritics';

export function useVisibleChildren(
	search: Ref<string | null>,
	modelValue: Ref<(string | number)[]>,
	children: Ref<Record<string, any>[]>,
	showSelectionOnly: Ref<boolean>,
	itemText: Ref<string>,
	itemValue: Ref<string>,
	itemChildren: Ref<string>,
	parentValue: Ref<string | number | null>,
	value: Ref<string | number>
) {
	const visibleChildrenValues = computed(() => {
		let options = children.value || [];

		if (search.value) {
			const searchText = removeDiacritics(search.value.toLowerCase());

			options = options.filter(
				(child) =>
					child[itemText.value].toLowerCase().includes(searchText) ||
					childrenHaveSearchMatch(child[itemChildren.value], searchText)
			);
		}

		if (showSelectionOnly.value) {
			options = options.filter(
				(child) =>
					modelValue.value.includes(child[itemValue.value]) ||
					childrenHaveValueMatch(child[itemChildren.value]) ||
					(parentValue.value && modelValue.value.includes(parentValue.value)) ||
					modelValue.value.includes(value.value)
			);
		}

		return options.map((child) => child[itemValue.value]);

		function childrenHaveSearchMatch(children: Record<string, any>[] | undefined, searchText: string): boolean {
			if (!children) return false;
			return children.some(
				(child) =>
					child[itemText.value].toLowerCase().includes(searchText) ||
					childrenHaveSearchMatch(child[itemChildren.value], searchText)
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
