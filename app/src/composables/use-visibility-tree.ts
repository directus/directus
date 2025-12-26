import { computed, type ComputedRef, type Ref } from 'vue';

export interface VisibilityTreeNode<T = string> {
	id: T;
	visible: boolean;
	children: VisibilityTreeNode<T>[];
	search: string | null;
	findChild(id: T): VisibilityTreeNode<T> | undefined;
}

export interface UseVisibilityTreeConfig<T, ID = string> {
	/** Extract the unique ID from an item */
	getId: (item: T) => ID;
	/** Get the parent ID for an item (null for root items) */
	getParent: (item: T) => ID | null;
	/** Check if an item matches the search query */
	matchesSearch: (item: T, search: string) => boolean;
}

export interface UseVisibilityTreeReturn<ID = string> {
	visibilityTree: ComputedRef<VisibilityTreeNode<ID>[]>;
	findVisibilityNode: (id: ID, tree?: VisibilityTreeNode<ID>[]) => VisibilityTreeNode<ID> | undefined;
}

/**
 * Generic composable for managing visibility tree with search filtering.
 * Supports hierarchical items with backward propagation (parent visible if any child matches).
 *
 * @param items - Reactive ref of items to build tree from
 * @param search - Reactive ref of current search query
 * @param config - Configuration for ID extraction, parent lookup, and search matching
 */
export function useVisibilityTree<T, ID = string>(
	items: Ref<T[]>,
	search: Ref<string | null>,
	config: UseVisibilityTreeConfig<T, ID>,
): UseVisibilityTreeReturn<ID> {
	function findVisibilityNode(
		id: ID,
		tree: VisibilityTreeNode<ID>[] = visibilityTree.value,
	): VisibilityTreeNode<ID> | undefined {
		for (const node of tree) {
			if (node.id === id) return node;

			const found = findVisibilityNode(id, node.children);

			if (found) return found;
		}

		return undefined;
	}

	const visibilityTree = computed(() => {
		const tree: VisibilityTreeNode<ID>[] = makeTree(null);
		const propagateBackwards: VisibilityTreeNode<ID>[] = [];

		function makeTree(parent: ID | null): VisibilityTreeNode<ID>[] {
			const children = items.value.filter((item) => config.getParent(item) === parent);

			const normalizedSearch = search.value?.toLowerCase();

			return children.map((item) => {
				const id = config.getId(item);

				return {
					id,
					visible: normalizedSearch ? config.matchesSearch(item, normalizedSearch) : true,
					search: search.value,
					children: makeTree(id),
					findChild(childId: ID) {
						return findVisibilityNode(childId, this.children);
					},
				};
			});
		}

		// Collect nodes with children for backward propagation
		breadthSearch(tree);

		function breadthSearch(nodes: VisibilityTreeNode<ID>[]) {
			for (const node of nodes) {
				if (node.children.length === 0) continue;

				propagateBackwards.unshift(node);
			}

			for (const node of nodes) {
				breadthSearch(node.children);
			}
		}

		// Propagate visibility backwards: parent visible if any child is visible
		for (const node of propagateBackwards) {
			node.visible = node.visible || node.children.some((child) => child.visible);
		}

		return tree;
	});

	return {
		visibilityTree,
		findVisibilityNode,
	};
}
