import { defineOperationApi, parseJSON } from '@directus/shared/utils';
import encodeUrl from 'encodeurl';

type Options = {
	url: string;
	method: string;
	body: Record<string, any> | string | null;
	headers?: { header: string; value: string }[] | null;
};

export default defineOperationApi<Options>({
	id: 'request',

	handler: async ({ url, method, body, headers }) => {
		const axios = (await import('axios')).default;

		const customHeaders =
			headers?.reduce((acc, { header, value }) => {
				acc[header] = value;
				return acc;
			}, {} as Record<string, string>) ?? {};

		if (!customHeaders['Content-Type'] && isValidJSON(body)) {
			customHeaders['Content-Type'] = 'application/json';
		}

		const result = await axios({
			url: encodeUrl(url),
			method,
			data: body,
			headers: customHeaders,
		});

		return { status: result.status, statusText: result.statusText, headers: result.headers, data: result.data };

		function isValidJSON(value: any): boolean {
			try {
				parseJSON(value);
				return true;
			} catch {
				return false;
			}
		}
	},
});
