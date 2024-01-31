import { createError } from '@directus/errors';
import type { GraphQLError } from 'graphql';

interface GraphQLExecutionErrorExtensions {
	errors: GraphQLError[];
}

export const GraphQLExecutionError = createError<GraphQLExecutionErrorExtensions>(
	'GRAPHQL_EXECUTION',
	'GraphQL execution error.',
	400,
);
