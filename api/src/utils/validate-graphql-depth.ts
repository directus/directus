import {
	DefinitionNode,
	GraphQLError,
	Kind,
	ListValueNode,
	ObjectFieldNode,
	ObjectValueNode,
	SelectionNode,
	ValidationContext,
	ValueNode,
} from 'graphql';
import env from '../env';

export function validateGraphQLDepth(context: ValidationContext): any {
	const { definitions } = context.getDocument();
	const fragments = definitions.reduce(
		(map: Record<string, DefinitionNode | SelectionNode>, definition: DefinitionNode | SelectionNode) => {
			if (definition.kind === Kind.FRAGMENT_DEFINITION) {
				map[definition.name.value] = definition;
			}
			return map;
		},
		{}
	);
	const operations = definitions.reduce(
		(map: Record<string, DefinitionNode | SelectionNode>, definition: DefinitionNode | SelectionNode) => {
			if (definition.kind === Kind.OPERATION_DEFINITION) {
				map[definition.name ? definition.name.value : ''] = definition;
			}
			return map;
		},
		{}
	);

	for (const name in operations) {
		const depth = calculateDepth(operations[name], fragments, context);

		if (depth > env.MAX_RELATIONAL_DEPTH) {
			context.reportError(new GraphQLError(`Max relational depth exceeded.`));
			break;
		}
	}

	return context;
}

function calculateFilterDepth(node: ValueNode | ObjectFieldNode, context: ValidationContext): number {
	switch (node.kind) {
		case Kind.OBJECT:
			return Math.max(...node.fields.map((selection) => calculateFilterDepth(selection, context)));
		case Kind.OBJECT_FIELD:
			if (node.name.value === '_or' || node.name.value === '_and') {
				return Math.max(
					...(node.value as ListValueNode).values.map((selection) => calculateFilterDepth(selection, context))
				);
			} else if (node.value.kind !== Kind.OBJECT) {
				return 0;
			} else if (node.name.value.startsWith('_')) {
				return Math.max(
					...(node.value as ObjectValueNode).fields.map((selection) => calculateFilterDepth(selection, context))
				);
			} else {
				return (
					Math.max(
						...(node.value as ObjectValueNode).fields.map((selection) => calculateFilterDepth(selection, context))
					) + 1
				);
			}
		default:
			context.reportError(new GraphQLError(`Unable to calculate depth for ${node.kind}.`));
			return 0;
	}
}

function calculateDepth(
	node: SelectionNode | DefinitionNode,
	fragments: Record<string, DefinitionNode | SelectionNode>,
	context: ValidationContext
): number {
	let filterDepth = 0;

	switch (node.kind) {
		case Kind.FIELD:
			node.arguments?.map((arg) => {
				if (arg.kind === Kind.ARGUMENT && arg.name.kind === Kind.NAME && arg.name.value === 'filter') {
					// Filter can only appear once per level
					// First level filter is counted under the current node
					filterDepth = calculateFilterDepth(arg.value, context) - 1;
				}
			});

			// Ignore introspection fields
			if (/^__/.test(node.name.value) || !node.selectionSet) {
				return 0;
			}

			return (
				Math.max(
					filterDepth,
					...node.selectionSet.selections.map((selection) => calculateDepth(selection, fragments, context))
				) + 1
			);
		case Kind.FRAGMENT_SPREAD:
			return calculateDepth(fragments[node.name.value], fragments, context);
		case Kind.INLINE_FRAGMENT:
		case Kind.FRAGMENT_DEFINITION:
		case Kind.OPERATION_DEFINITION:
			if (!node.selectionSet) {
				return 0;
			}

			return Math.max(
				...node.selectionSet.selections.map((selection) => calculateDepth(selection, fragments, context))
			);
		default:
			context.reportError(new GraphQLError(`Unable to calculate depth for ${node.kind}.`));
			return 0;
	}
}
