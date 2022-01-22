import { defineOperationApi } from '@directus/shared/utils';

type Options = {
	json: string;
};

export default defineOperationApi<Options>({
	id: 'transform',

	handler: ({ json }) => {
		return JSON.parse(json);
	},
});
