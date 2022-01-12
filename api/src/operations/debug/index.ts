import { defineOperationApi } from '@directus/shared/utils';
import logger from '../../logger';

export default defineOperationApi({
	id: 'debug',

	handler: (data, options) => {
		logger.info('DEBUG');
		logger.info(options);
	},
});
