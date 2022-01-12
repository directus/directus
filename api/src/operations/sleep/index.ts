import { defineOperationApi } from '@directus/shared/utils';

export default defineOperationApi({
	id: 'sleep',

	handler: async (_data, options) => {
		return new Promise((resolve) => setTimeout(resolve, options.milliseconds));
	},
});
