import { remove as removeDiacritics } from 'diacritics';
import { computed, Ref } from 'vue';

export function useVisibleChildren(
	search: Ref<string | null>,
	modelValue: Ref<(string | number)[]>,
	children: Ref<Record<string, any>[]>,
	showSelectionOnly: Ref<boolean>,
	itemText: Ref<string>,
	itemValue: Ref<string>,
	itemChildren: Ref<string>,
	parentValue: Ref<string | number | null>,
	value: Ref<string | number>,
) {
	const visibleChildrenValues = computed(() => {
		let options = children.value || [];
		const _search = search.value;

		if (_search) {
			options = options.filter((child) => {
				const normalizedItemText = removeDiacritics(child[itemText.value]).toLowerCase();

				return normalizedItemText.includes(_search) || childrenHaveSearchMatch(child[itemChildren.value]);
			});
		}

		if (showSelectionOnly.value) {
			options = options.filter(
				(child) =>
					modelValue.value.includes(child[itemValue.value]) ||
					childrenHaveValueMatch(child[itemChildren.value]) ||
					(parentValue.value && modelValue.value.includes(parentValue.value)) ||
					modelValue.value.includes(value.value),
			);
		}

		return options.map((child) => child[itemValue.value]);

		function childrenHaveSearchMatch(children: Record<string, any>[] | undefined): boolean {
			if (!children || !_search) return false;
			return children.some((child) => {
				const normalizedItemText = removeDiacritics(child[itemText.value]).toLowerCase();

				return normalizedItemText.includes(_search) || childrenHaveSearchMatch(child[itemChildren.value]);
			});
		}

		function childrenHaveValueMatch(children: Record<string, any>[] | undefined): boolean {
			if (!children) return false;
			return children.some(
				(child) =>
					modelValue.value.includes(child[itemValue.value]) || childrenHaveValueMatch(child[itemChildren.value]),
			);
		}
	});

	return { visibleChildrenValues };
}
