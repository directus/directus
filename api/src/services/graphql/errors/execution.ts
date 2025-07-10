import { createError } from '@directus/errors';
import type { GraphQLError, GraphQLFormattedError } from 'graphql';

interface GraphQLExecutionErrorExtensions {
	errors: (GraphQLError | GraphQLFormattedError)[];
}

export const GraphQLExecutionError = createError<GraphQLExecutionErrorExtensions>(
	'GRAPHQL_EXECUTION',
	'GraphQL execution error.',
	400,
);
