import { type DirectusError, isDirectusError } from '@directus/errors';
import type { Accountability } from '@directus/types';
import type { GraphQLError, GraphQLFormattedError } from 'graphql';
import { useLogger } from '../../../logger/index.js';

const processError = (
	accountability: Accountability | null,
	error: Readonly<GraphQLError & { originalError: GraphQLError | DirectusError | Error | undefined }>,
): GraphQLFormattedError => {
	const logger = useLogger();

	logger.error(error);

	// When there is no originalError the GraphQL runtime itself produced this error
	// (e.g. query validation failure, syntax error, unknown field). These are safe to
	// surface to every caller regardless of admin status — they describe the request,
	// not internal server state. (#21264)
	if (!error.originalError) {
		return {
			message: error.message,
			extensions: {
				code: (error.extensions?.['code'] as string | undefined) ?? 'GRAPHQL_VALIDATION_FAILED',
			},
			...(error.locations && { locations: error.locations }),
			...(error.path && { path: error.path }),
		};
	}

	let originalError = error.originalError;

	if (originalError && 'originalError' in originalError) {
		originalError = originalError.originalError;
	}

	if (isDirectusError(originalError)) {
		return {
			message: originalError.message,
			extensions: {
				code: originalError.code,
				...(originalError.extensions ?? {}),
			},
			...(error.locations && { locations: error.locations }),
			...(error.path && { path: error.path }),
		};
	} else {
		if (accountability?.admin === true) {
			const graphqlFormattedError: {
				-readonly [key in keyof GraphQLFormattedError]: GraphQLFormattedError[key];
			} = {
				message: error.message,
				extensions: {
					code: 'INTERNAL_SERVER_ERROR',
				},
				...(error.locations && { locations: error.locations }),
				...(error.path && { path: error.path }),
			};

			return graphqlFormattedError;
		} else {
			return {
				message: 'An unexpected error occurred.',
				extensions: {
					code: 'INTERNAL_SERVER_ERROR',
				},
			};
		}
	}
};

export default processError;
