import logger from '../../../logger';
import { GraphQLError, GraphQLFormattedError } from 'graphql';
import { Accountability } from '@directus/shared/types';

const processError = (accountability: Accountability | null, error: Readonly<GraphQLError>): GraphQLFormattedError => {
	logger.error(error);

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
};

export default processError;
