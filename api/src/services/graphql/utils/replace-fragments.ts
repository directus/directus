import type { FragmentDefinitionNode, SelectionNode } from 'graphql';
import { flatten } from 'lodash-es';

/**
 * Replace all fragments in a selectionset for the actual selection set as defined in the fragment
 * Effectively merges the selections with the fragments used in those selections
 */
export function replaceFragmentsInSelections(
	selections: readonly SelectionNode[] | undefined,
	fragments: Record<string, FragmentDefinitionNode>,
): readonly SelectionNode[] | null {
	if (!selections) return null;

	const result = flatten(
		selections.map((selection) => {
			// Fragments can contains fragments themselves. This allows for nested fragments
			if (selection.kind === 'FragmentSpread') {
				return replaceFragmentsInSelections(fragments[selection.name.value]!.selectionSet.selections, fragments);
			}

			// Nested relational fields can also contain fragments
			if ((selection.kind === 'Field' || selection.kind === 'InlineFragment') && selection.selectionSet) {
				selection.selectionSet.selections = replaceFragmentsInSelections(
					selection.selectionSet.selections,
					fragments,
				) as readonly SelectionNode[];
			}

			return selection;
		}),
	).filter((s) => s) as SelectionNode[];

	return result;
}
