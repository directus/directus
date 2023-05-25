import { FieldNode } from '@/composables/use-field-tree';

/**
 * Returns the given tree without FieldNodes that have the "group" flag set.
 */
export function flattenFieldGroups(tree: FieldNode[]): FieldNode[] {
	function flattenGroups(list: FieldNode[]): FieldNode[] {
		return list.flatMap((item: FieldNode) => {
			if (Array.isArray(item.children) && item.children.length > 0) {
				if (item.group === true) {
					return flattenGroups(item.children);
				} else {
					item.children = flattenGroups(item.children);
				}
			}

			return item;
		});
	}

	return flattenGroups(tree);
}
