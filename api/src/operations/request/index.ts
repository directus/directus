import { defineOperationApi } from '@directus/shared/utils';
import axios, { Method } from 'axios';

type Options = {
	url: string;
	method: Method;
	payload: string;
	headers: Record<string, string>;
};

export default defineOperationApi<Options>({
	id: 'request',

	handler: async ({ url, method, payload, headers }) => {
		const result = await axios({ url, method, data: payload, headers });

		return { status: result.status, statusText: result.statusText, headers: result.headers, data: result.data };
	},
});
