import { defineOperationApi } from '@directus/shared/utils';

export default defineOperationApi({
	id: 'sleep',

	handler: async ({ milliseconds }) => {
		return new Promise((resolve) => setTimeout(resolve, Number(milliseconds)));
	},
});
