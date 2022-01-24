import { defineOperationApi } from '@directus/shared/utils';

type Options = {
	milliseconds: string;
};

export default defineOperationApi<Options>({
	id: 'sleep',

	handler: async ({ milliseconds }) => {
		return new Promise((resolve) => setTimeout(resolve, Number(milliseconds)));
	},
});
