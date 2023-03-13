import { defineOperationApi, isValidJSON } from '@directus/shared/utils';
import encodeUrl from 'encodeurl';
import { getAxios } from '../../request/index';

type Options = {
	url: string;
	method: string;
	body: Record<string, any> | string | null;
	headers?: { header: string; value: string }[] | null;
};

export default defineOperationApi<Options>({
	id: 'request',

	handler: async ({ url, method, body, headers }) => {
		const customHeaders =
			headers?.reduce((acc, { header, value }) => {
				acc[header] = value;
				return acc;
			}, {} as Record<string, string>) ?? {};

		if (!customHeaders['Content-Type'] && (typeof body === 'object' || isValidJSON(body))) {
			customHeaders['Content-Type'] = 'application/json';
		}

		const axios = await getAxios();

		try {
			const result = await axios({
				url: encodeUrl(url),
				method,
				data: body,
				headers: customHeaders,
			});

			return { status: result.status, statusText: result.statusText, headers: result.headers, data: result.data };
		} catch (error: any) {
			throw JSON.stringify({
				status: error.response.status,
				statusText: error.response.statusText,
				headers: error.response.headers,
				data: error.response.data,
			});
		}
	},
});
