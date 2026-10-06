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
 * @param visited The named fragments already spread into this selection set
 * @returns The same selections, with any fragments in them swapped for their underlying selection set
 */
function replaceInSelections(
	selections: readonly SelectionNode[] | undefined,
	parentType: GraphQLNamedType | undefined,
	info: FragmentContext,
	visited: Set<string>,
): readonly SelectionNode[] | null {
	if (!selections) return null;

	return selections.flatMap((selection): readonly SelectionNode[] => {
		// A named (spread) fragment and an inline one are essentially the same, except for fragment location.
		// Unknown fragments are rejected before this during schema validation.
		if (selection.kind === Kind.FRAGMENT_SPREAD || selection.kind === Kind.INLINE_FRAGMENT) {
			if (selection.kind === Kind.FRAGMENT_SPREAD) {
				// Spreading a fragment into the same selection set twice contributes nothing the second
				// time, and expanding it again is what makes `Fk { ...Fk-1 ...Fk-1 }` cost 2^k. This is the
				// visited set `CollectFields` keeps in the spec.
				if (visited.has(selection.name.value)) return [];

				visited.add(selection.name.value);
			}

			const fragment = selection.kind === Kind.FRAGMENT_SPREAD ? info.fragments[selection.name.value]! : selection;
			const { typeCondition } = fragment;
			const conditionType = typeCondition ? getNamedType(info.schema.getType(typeCondition.name.value)) : undefined;

			// What is inside a fragment belongs to the type the fragment is written on and is therefore passed down.
			const children =
				replaceInSelections(fragment.selectionSet.selections, conditionType ?? parentType, info, visited) ?? [];

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
						// A nested field is collected on its own, so it starts with nothing spread into it yet
						selections:
							replaceInSelections(
								selection.selectionSet.selections,
								fieldType && getNamedType(fieldType),
								info,
								new Set(),
							) ?? [],
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
 * @param info The resolve info of the field being resolved
 * @returns The selections asked for on that field, or null when it has no selection set
 */
export function buildSelections(info: GraphQLResolveInfo): readonly SelectionNode[] | null {
	return replaceInSelections(
		info.fieldNodes[0]?.selectionSet?.selections,
		getNamedType(info.returnType),
		info,
		new Set(),
	);
}
