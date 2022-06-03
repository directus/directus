import { defineOperationApi } from '@directus/shared/utils';
import axios, { Method } from 'axios';

type Options = {
	url: string;
	method: Method;
	body: Record<string, any> | string | null;
	headers: Record<string, string>;
};

export default defineOperationApi<Options>({
	id: 'request',

	handler: async ({ url, method, body, headers }) => {
		const result = await axios({ url, method, data: body, headers });

		return { status: result.status, statusText: result.statusText, headers: result.headers, data: result.data };
	},
});
