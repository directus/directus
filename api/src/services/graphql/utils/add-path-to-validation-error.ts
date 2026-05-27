import { GraphQLError, locatedError, Token } from 'graphql';

export function addPathToValidationError(validationError: GraphQLError): GraphQLError {
	const token = validationError.nodes?.[0]?.loc?.startToken;

	if (!token) return validationError;

	let prev: Token | null = token;

	const queryRegex = /query_[A-Za-z0-9]{8}/;

	while (prev) {
		if (prev.kind === 'Name' && prev.value && queryRegex.test(prev.value)) {
			return locatedError(validationError, validationError.nodes, [prev.value]);
		}

		prev = prev.prev;
	}

	return locatedError(validationError, validationError.nodes);
}
