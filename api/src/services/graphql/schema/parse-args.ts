import type { ArgumentNode, GraphQLResolveInfo, ValueNode } from 'graphql';

/**
 * GraphQL's regular resolver `args` variable only contains the "top-level" arguments. Seeing that we convert the
 * whole nested tree into one big query using Directus' own query resolver, we want to have a nested structure of
 * arguments for the whole resolving tree, which can later be transformed into Directus' AST using `deep`.
 * In order to do that, we'll parse over all ArgumentNodes and ObjectFieldNodes to manually recreate an object structure
 * of arguments
 */
export function parseArgs(
	args: readonly ArgumentNode[],
	variableValues: GraphQLResolveInfo['variableValues'],
): Record<string, any> {
	if (!args || args['length'] === 0) return {};

	const parse = (node: ValueNode): any => {
		switch (node.kind) {
			case 'Variable':
				return variableValues[node.name.value];
			case 'ListValue':
				return node.values.map(parse);
			case 'ObjectValue':
				return Object.fromEntries(node.fields.map((node) => [node.name.value, parse(node.value)]));
			case 'NullValue':
				return null;
			case 'StringValue':
				return String(node.value);
			case 'IntValue':
			case 'FloatValue':
				return Number(node.value);
			case 'BooleanValue':
				return Boolean(node.value);
			case 'EnumValue':
			default:
				return 'value' in node ? node.value : null;
		}
	};

	const argsObject = Object.fromEntries(args['map']((arg) => [arg.name.value, parse(arg.value)]));

	return argsObject;
}
