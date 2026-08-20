import type {
	ArgumentNode,
	FieldNode,
	FragmentDefinitionNode,
	FragmentSpreadNode,
	GraphQLOutputType,
	GraphQLResolveInfo,
	GraphQLSchema,
	InlineFragmentNode,
	SelectionNode,
	SelectionSetNode,
	ValueNode,
} from 'graphql';
import { Kind } from 'graphql';
import { isObject, map } from 'lodash-es';

const buildName = (value: string) => ({ kind: Kind.NAME, value }) as const;

const buildSelectionSet = (selections: readonly SelectionNode[]): SelectionSetNode => ({
	kind: Kind.SELECTION_SET,
	selections,
});

/** `fieldName`, `alias: fieldName`, `fieldName(args)` or `fieldName { children }` */
export function buildField(
	fieldName: string,
	options?: { alias?: string; args?: readonly ArgumentNode[]; children?: readonly SelectionNode[] },
): FieldNode {
	return {
		kind: Kind.FIELD,
		name: buildName(fieldName),
		...(options?.alias && { alias: buildName(options.alias) }),
		...(options?.args && { arguments: options.args }),
		...(options?.children && { selectionSet: buildSelectionSet(options.children) }),
	};
}

/** `... on Type { children }` */
export function buildInlineFragment(type: string, children: readonly SelectionNode[]): InlineFragmentNode {
	return {
		kind: Kind.INLINE_FRAGMENT,
		typeCondition: { kind: Kind.NAMED_TYPE, name: buildName(type) },
		selectionSet: buildSelectionSet(children),
	};
}

/** `...FragmentName` */
export function buildFragmentSpread(fragmentName: string): FragmentSpreadNode {
	return { kind: Kind.FRAGMENT_SPREAD, name: buildName(fragmentName) };
}

/** `fragment FragmentName on Type { children }`, to register in the fragments of a resolve info */
export function buildFragmentDefinition(
	fragmentName: string,
	type: string,
	children: readonly SelectionNode[],
): FragmentDefinitionNode {
	return {
		kind: Kind.FRAGMENT_DEFINITION,
		name: buildName(fragmentName),
		typeCondition: { kind: Kind.NAMED_TYPE, name: buildName(type) },
		selectionSet: buildSelectionSet(children),
	};
}

/** `argName: value` — an int for numbers, a string otherwise */
export function buildArgument(argName: string, value: string | number): ArgumentNode {
	return {
		kind: Kind.ARGUMENT,
		name: buildName(argName),
		value: typeof value === 'number' ? { kind: Kind.INT, value: String(value) } : { kind: Kind.STRING, value },
	};
}

/** A `filter` argument, from the plain object form of the filter */
export function buildFilterArgument(filter: Record<string, any>): ArgumentNode {
	const toValue = (value: unknown): ValueNode =>
		isObject(value)
			? {
					kind: Kind.OBJECT,
					fields: map(value, (nested, key) => ({
						kind: Kind.OBJECT_FIELD,
						name: buildName(key),
						value: toValue(nested),
					})),
				}
			: { kind: Kind.STRING, value: String(value) };

	return { kind: Kind.ARGUMENT, name: buildName('filter'), value: toValue(filter) };
}

/** Stand in for the resolve info a resolver receives for the field it is resolving */
export function buildResolveInfo(options: {
	selections: readonly SelectionNode[];
	mergedSelections?: readonly (readonly SelectionNode[])[];
	fragments?: Record<string, FragmentDefinitionNode>;
	schema: GraphQLSchema;
	returnType: GraphQLOutputType;
}): GraphQLResolveInfo {
	return {
		fieldNodes: [options.selections, ...(options.mergedSelections ?? [])].map((selections) =>
			buildField('resolved', { children: selections }),
		),
		fragments: options.fragments ?? {},
		schema: options.schema,
		returnType: options.returnType,
	} as unknown as GraphQLResolveInfo;
}
