import type { DirectusError } from '@directus/errors';
import { GraphQLError } from 'graphql';
import { set } from 'lodash-es';

/**
 * Convert Directus-Exception into a GraphQL format, so it can be returned by GraphQL properly.
 */
export function formatError(error: DirectusError | DirectusError[]): GraphQLError {
	if (Array.isArray(error)) {
		set(error[0]!, 'extensions.code', error[0]!.code);
		return new GraphQLError(error[0]!.message, undefined, undefined, undefined, undefined, error[0]);
	}

	set(error, 'extensions.code', error.code);
	return new GraphQLError(error.message, undefined, undefined, undefined, undefined, error);
}
