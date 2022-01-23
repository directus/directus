import {
	ArgumentNode,
	BooleanValueNode,
	GraphQLResolveInfo,
	IntValueNode,
	ObjectFieldNode,
	ObjectValueNode,
	StringValueNode,
} from 'graphql';

/**
 * GraphQL's regular resolver `args` variable only contains the "top-level" arguments. Seeing that we convert the
 * whole nested tree into one big query using Directus' own query resolver, we want to have a nested structure of
 * arguments for the whole resolving tree, which can later be transformed into Directus' AST using `deep`.
 * In order to do that, we'll parse over all ArgumentNodes and ObjectFieldNodes to manually recreate an object structure
 * of arguments
 * */
export const parseArgs = (
	args: readonly ArgumentNode[] | readonly ObjectFieldNode[],
	variableValues: GraphQLResolveInfo['variableValues']
): Record<string, any> => {
	if (!args || args.length === 0) return {};

	const parseObjectValue = (arg: ObjectValueNode) => {
		return parseArgs(arg.fields, variableValues);
	};

	const argsObject: any = {};

	for (const argument of args) {
		if (argument.value.kind === 'ObjectValue') {
			argsObject[argument.name.value] = parseObjectValue(argument.value);
		} else if (argument.value.kind === 'Variable') {
			argsObject[argument.name.value] = variableValues[argument.value.name.value];
		} else if (argument.value.kind === 'ListValue') {
			const values: any = [];

			for (const valueNode of argument.value.values) {
				if (valueNode.kind === 'ObjectValue') {
					values.push(parseArgs(valueNode.fields, variableValues));
				} else {
					values.push((valueNode as any).value);
				}
			}

			argsObject[argument.name.value] = values;
		} else {
			argsObject[argument.name.value] = (argument.value as IntValueNode | StringValueNode | BooleanValueNode).value;
		}
	}

	return argsObject;
};
