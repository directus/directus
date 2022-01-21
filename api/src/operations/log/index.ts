import { defineOperationApi } from '@directus/shared/utils';
import logger from '../../logger';

export default defineOperationApi({
	id: 'log',

	handler: ({ message }) => {
		logger.info(`Flow: ${String(message)}`);
	},
});
