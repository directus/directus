import { isDirectusError, type DirectusError } from '@directus/errors';
import type { Accountability } from '@directus/types';
import type { GraphQLError, GraphQLFormattedError } from 'graphql';
import logger from '../../../logger.js';

const processError = (
	accountability: Accountability | null,
	error: Readonly<GraphQLError & { originalError: GraphQLError | DirectusError | Error | undefined }>,
): GraphQLFormattedError => {
	logger.error(error);

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
			};

			if (error.locations) {
				graphqlFormattedError.locations = error.locations;
			}

			if (error.path) {
				graphqlFormattedError.path = error.path;
			}

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
