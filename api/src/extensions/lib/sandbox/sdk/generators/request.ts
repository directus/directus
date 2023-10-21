import type { ExtensionSandboxRequestedScopes } from '@directus/extensions';
import encodeUrl from 'encodeurl';
import type { Reference } from 'isolated-vm';
import { getAxios } from '../../../../../request/index.js';

export function requestGenerator(requestedScopes: ExtensionSandboxRequestedScopes): (
	url: Reference<string>,
	options: Reference<{
		method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
		body?: Record<string, any> | string;
		headers?: { header: string; value: string }[];
	}>
) => Promise<{
	status: number;
	statusText: string;
	headers: Record<string, any>;
	data: string;
}> {
	return async (url, options) => {
		if (url.typeof !== 'string') throw new Error('Request url has to be of type string');
		if (options.typeof !== 'undefined' && options.typeof !== 'object')
			throw new Error('Request options has to be of type object');

		const urlCopied = await url.copy();

		const permissions = requestedScopes.request?.permissions;

		if (permissions === undefined) throw new Error('No permission to access "request"');

		if (!permissions.urls.includes(urlCopied)) throw new Error(`No permission to request "${urlCopied}"`);

		const method = options.typeof !== 'undefined' ? await options.get('method', { reference: true }) : undefined;
		const body = options.typeof !== 'undefined' ? await options.get('body', { reference: true }) : undefined;
		const headers = options.typeof !== 'undefined' ? await options.get('headers', { reference: true }) : undefined;

		if (method !== undefined && method.typeof !== 'undefined' && method.typeof !== 'string')
			throw new Error('Request method has to be of type string');
		if (body !== undefined && body.typeof !== 'undefined' && body.typeof !== 'string' && body.typeof !== 'object')
			throw new Error('Request body has to be of type string or object');
		if (headers !== undefined && headers.typeof !== 'undefined' && headers.typeof !== 'array')
			throw new Error('Request headers has to be of type array');

		const methodCopied = await method?.copy();
		const bodyCopied = await body?.copy();
		const headersCopied = await headers?.copy();

		if (!permissions.methods.includes(methodCopied ?? 'GET'))
			throw new Error(`No permission to use request method "${methodCopied}"`);

		const customHeaders =
			headersCopied?.reduce((acc, { header, value }) => {
				acc[header] = value;
				return acc;
			}, {} as Record<string, string>) ?? {};

		const axios = await getAxios();

		const result = await axios({
			url: encodeUrl(urlCopied),
			method: methodCopied ?? 'GET',
			data: bodyCopied ?? null,
			headers: customHeaders,
		});

		return { status: result.status, statusText: result.statusText, headers: result.headers, data: result.data };
	};
}
