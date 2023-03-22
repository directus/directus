import { BaseException } from '@directus/shared/exceptions';
import type { Accountability } from '@directus/shared/types';
import type { GraphQLError, GraphQLFormattedError } from 'graphql';
import logger from '../../../logger';

const processError = (accountability: Accountability | null, error: Readonly<GraphQLError>): GraphQLFormattedError => {
	logger.error(error);

	const { originalError } = error;

	if (originalError instanceof BaseException) {
		return {
			message: originalError.message,
			extensions: {
				code: originalError.code,
				...originalError.extensions,
			},
		};
	} else {
		if (accountability?.admin === true) {
			return {
				...error,
				extensions: {
					code: 'INTERNAL_SERVER_ERROR',
				},
			};
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
