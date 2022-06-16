import { GraphQLError, Token, locatedError } from 'graphql';

export function addPathToValidationError(validationError: GraphQLError): GraphQLError {
	const token = validationError.nodes?.[0]?.loc?.startToken;

	if (!token) return validationError;

	const path: string[] = [];

	let prev: Token | null = token;

	while (prev) {
		if (prev.kind === 'Name' && prev.value) path.unshift(prev.value);
		prev = prev.prev;
	}

	// First item is the root "query" / "mutation"
	path.shift();

	return locatedError(validationError, validationError.nodes, path);
}
