import { defineOperationApi } from '@directus/shared/utils';
import logger from '../../logger';

type Options = {
	message: string;
};

export default defineOperationApi<Options>({
	id: 'log',

	handler: ({ message }) => {
		logger.info(message);
	},
});
