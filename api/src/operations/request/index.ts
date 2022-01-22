import { defineOperationApi } from '@directus/shared/utils';
import axios, { Method } from 'axios';

type Options = {
	url: string;
	method: Method;
	data: unknown;
	headers: Record<string, string>;
};

export default defineOperationApi<Options>({
	id: 'request',

	handler: async ({ url, method, data, headers }) => {
		const result = await axios({ url, method, data, headers });

		return result;
	},
});
