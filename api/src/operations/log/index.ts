import { defineOperationApi } from '@directus/shared/utils';
import logger from '../../logger';

export default defineOperationApi({
	id: 'log',

	handler: (_data, options) => {
		logger.info(`Flow: ${options.message}`);
	},
});
