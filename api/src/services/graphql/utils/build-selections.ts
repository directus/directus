import type { GraphQLNamedType, GraphQLResolveInfo, SelectionNode } from 'graphql';
import { getNamedType, isAbstractType, isObjectType, Kind } from 'graphql';

/** The bits of the resolve info that every level of the recursion needs */
type FragmentContext = Pick<GraphQLResolveInfo, 'fragments' | 'schema'>;

/**
 * Swap every fragment in a selection set for the selections it holds
 *
 * @param selections The selections to look through
 * @param parentType The type these selections belong to
 * @param info The fragments of this request (if any), and the schema to look type names up in
 * @returns The same selections, with any fragments in them swapped for their underlying selection set
 */
function replaceInSelections(
	selections: readonly SelectionNode[] | undefined,
	parentType: GraphQLNamedType | undefined,
	info: FragmentContext,
): readonly SelectionNode[] | null {
	if (!selections) return null;

	return selections.flatMap((selection): readonly SelectionNode[] => {
		// A named (spread) fragment and an inline one are essentially the same, except for fragment location.
		// Unknown fragments are rejected before this during schema validation.
		if (selection.kind === Kind.FRAGMENT_SPREAD || selection.kind === Kind.INLINE_FRAGMENT) {
			const fragment = selection.kind === Kind.FRAGMENT_SPREAD ? info.fragments[selection.name.value]! : selection;
			const { typeCondition } = fragment;
			const conditionType = typeCondition ? getNamedType(info.schema.getType(typeCondition.name.value)) : undefined;

			// What is inside a fragment belongs to the type the fragment is written on and is therefore passed down.
			const children = replaceInSelections(fragment.selectionSet.selections, conditionType ?? parentType, info) ?? [];

			// Check type condition within fragment to check for relevant collection for m2a union. Not applicable for other relations.
			const narrowsUnion = parentType !== undefined && isAbstractType(parentType) && conditionType !== parentType;

			// The condition names no collection:
			// - `...Fields` on a collection type
			// - A fragment written on a `_union` type
			// - An inline fragment with no condition at all.
			//
			// A fragment without a type condition should be treated as regular selections.
			if (!typeCondition || !narrowsUnion) return children;

			return [
				{
					kind: Kind.INLINE_FRAGMENT,
					typeCondition,
					selectionSet: { kind: Kind.SELECTION_SET, selections: children },
				},
			];
		}

		// Nested relational fields can also contain fragments.
		if (selection.selectionSet) {
			// Pass down parent type if possible, only object types have fields.
			const fieldType = isObjectType(parentType) ? parentType.getFields()[selection.name.value]?.type : undefined;

			return [
				{
					...selection,
					selectionSet: {
						...selection.selectionSet,
						selections:
							replaceInSelections(selection.selectionSet.selections, fieldType && getNamedType(fieldType), info) ?? [],
					},
				},
			];
		}

		return [selection];
	});
}

/**
 * Build a flat selection set of the field being resolved, with every fragment in it swapped for the
 * selections it holds. Fragments can hold fragments, so this is done recursively.
 *
 * A field requested more than once resolves in a single call with one node per occurrence, so this
 * gathers the selections of every node.
 *
 * @param info The resolve info of the field being resolved
 * @returns The selections asked for on that field, or null when none of its nodes carry selections
 */
export function buildSelections(info: GraphQLResolveInfo): readonly SelectionNode[] | null {
	const parentType = getNamedType(info.returnType);

	const selections = info.fieldNodes.flatMap(
		(fieldNode) => replaceInSelections(fieldNode.selectionSet?.selections, parentType, info) ?? [],
	);

	return selections.length > 0 ? selections : null;
}
