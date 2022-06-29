import { defineOperationApi, optionToString } from '@directus/shared/utils';
import logger from '../../logger';

type Options = {
	message: unknown;
};

export default defineOperationApi<Options>({
	id: 'log',

	handler: ({ message }) => {
		logger.info(optionToString(message));
	},
});
