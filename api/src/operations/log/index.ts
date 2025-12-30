import { useLogger } from '../../logger/index.js';
import { defineOperationApi } from '@directus/extensions';
import { optionToString } from '@directus/utils';

type Options = {
	message: unknown;
};

export default defineOperationApi<Options>({
	id: 'log',

	handler: ({ message }) => {
		const logger = useLogger();

		logger.info(optionToString(message));
	},
});
