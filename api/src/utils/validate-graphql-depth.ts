import {
	DefinitionNode,
	GraphQLError,
	Kind,
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
		const depth = calculateDepth(operations[name], fragments, 0, context, name) ?? 0;

		if (depth > env.MAX_RELATIONAL_DEPTH) {
			context.reportError(new GraphQLError(`Max relational depth exceeded.`));
			break;
		}
	}

	return context;
}

function calculateFilterDepth(
	node: ValueNode | ObjectFieldNode,
	fragments: Record<string, DefinitionNode | SelectionNode>,
	currentDepth: number,
	context: ValidationContext,
	name: string
): number {
	switch (node.kind) {
		case Kind.OBJECT:
			return Math.max(
				...node.fields.map(
					(selection) => calculateFilterDepth(selection, fragments, currentDepth + 1, context, name) ?? 0
				)
			);
		case Kind.OBJECT_FIELD:
			if (node.value.kind !== Kind.OBJECT) {
				return 0;
			} else if (node.name.value.startsWith('_')) {
				return Math.max(
					...(node.value as ObjectValueNode).fields.map(
						(selection) => calculateFilterDepth(selection, fragments, currentDepth, context, name) ?? 0
					)
				);
			} else {
				return (
					Math.max(
						...(node.value as ObjectValueNode).fields.map(
							(selection) => calculateFilterDepth(selection, fragments, currentDepth, context, name) ?? 0
						)
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
	currentDepth: number,
	context: ValidationContext,
	name: string
): number {
	let filterDepth = 0;

	switch (node.kind) {
		case Kind.FIELD:
			node.arguments?.map((arg) => {
				if (arg.kind === Kind.ARGUMENT && arg.name.kind === Kind.NAME && arg.name.value === 'filter') {
					// Filter can only appear once per level
					filterDepth = calculateFilterDepth(arg.value, fragments, 0, context, name);
				}
			});

			// Ignore introspection fields
			if (/^__/.test(node.name.value) || !node.selectionSet) {
				return 0;
			}

			return (
				Math.max(
					filterDepth,
					...node.selectionSet.selections.map(
						(selection) => calculateDepth(selection, fragments, currentDepth + 1, context, name) ?? 0
					)
				) + 1
			);
		case Kind.FRAGMENT_SPREAD:
			return calculateDepth(fragments[node.name.value], fragments, currentDepth, context, name);
		case Kind.INLINE_FRAGMENT:
		case Kind.FRAGMENT_DEFINITION:
		case Kind.OPERATION_DEFINITION:
			if (!node.selectionSet) {
				return 0;
			}

			return Math.max(
				...node.selectionSet.selections.map(
					(selection) => calculateDepth(selection, fragments, currentDepth, context, name) ?? 0
				)
			);
		default:
			context.reportError(new GraphQLError(`Unable to calculate depth for ${node.kind}.`));
			return 0;
	}
}
