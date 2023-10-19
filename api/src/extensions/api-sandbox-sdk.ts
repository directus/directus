import encodeUrl from 'encodeurl';
import type { Reference } from 'isolated-vm';
import { setTimeout } from 'node:timers/promises';
import logger from '../logger.js';
import { getAxios } from '../request/index.js';

export function log(message: Reference<string>): void {
	if (message.typeof !== 'string') throw new Error('Log message has to be of type string');

	logger.info(message.copySync());
}

export async function sleep(milliseconds: Reference<number>): Promise<void> {
	if (milliseconds.typeof !== 'number') throw new Error('Sleep milliseconds has to be of type number');

	await setTimeout(await milliseconds.copy());
}

export async function request(
	url: Reference<string>,
	options?: Reference<{
		method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
		body?: Record<string, any> | string;
		headers?: { header: string; value: string }[];
	}>
): Promise<{
	status: number;
	statusText: string;
	headers: Record<string, any>;
	data: string;
}> {
	if (url.typeof !== 'string') throw new Error('Request url has to be of type string');
	if (options !== undefined && options.typeof !== 'object') throw new Error('Request url has to be of type string');

	const method = await options?.get('method', { reference: true });
	const body = await options?.get('body', { reference: true });
	const headers = await options?.get('headers', { reference: true });

	if (method !== undefined && method.typeof !== 'string') throw new Error('Request method has to be of type string');
	if (body !== undefined && body.typeof !== 'string' && body.typeof !== 'object')
		throw new Error('Request body has to be of type string or object');
	if (headers !== undefined && headers.typeof !== 'array') throw new Error('Request headers has to be of type array');

	const urlCopied = await url.copy();
	const methodCopied = await method?.copy();
	const bodyCopied = await body?.copy();
	const headersCopied = await headers?.copy();

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
}
