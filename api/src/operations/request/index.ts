import { defineOperationApi } from '@directus/shared/utils';
import axios, { Method } from 'axios';
import { optionToObject } from '../../utils/operation-options';

type Options = {
	url: string;
	method: Method;
	payload?: Record<string, any> | string | null;
	headers: Record<string, string>;
};

export default defineOperationApi<Options>({
	id: 'request',

	handler: async ({ url, method, payload, headers }) => {
		const payloadObject = optionToObject(payload) ?? null;

		const result = await axios({ url, method, data: payloadObject, headers });

		return { status: result.status, statusText: result.statusText, headers: result.headers, data: result.data };
	},
});
