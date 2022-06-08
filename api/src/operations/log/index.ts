import { defineOperationApi } from '@directus/shared/utils';
import logger from '../../logger';
import { optionToString } from '../../utils/operation-options';

type Options = {
	message: unknown;
};

export default defineOperationApi<Options>({
	id: 'log',

	handler: ({ message }) => {
		logger.info(optionToString(message));
	},
});
