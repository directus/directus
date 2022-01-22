import { defineOperationApi } from '@directus/shared/utils';
import logger from '../../logger';

type Options = {
	message: unknown;
};

export default defineOperationApi<Options>({
	id: 'log',

	handler: ({ message }) => {
		logger.info(`Flow: ${String(message)}`);
	},
});
