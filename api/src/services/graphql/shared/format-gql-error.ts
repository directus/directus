import { BaseException } from '@directus/shared/exceptions';
import { GraphQLError } from 'graphql';

/**
 * Convert Directus-Exception into a GraphQL format, so it can be returned by GraphQL properly.
 */
export const formatGQLError = (error: BaseException | BaseException[]): GraphQLError => {
	if (Array.isArray(error)) {
		return new GraphQLError(error[0].message, undefined, undefined, undefined, undefined, error[0]);
	}

	return new GraphQLError(error.message, undefined, undefined, undefined, undefined, error);
};
