import type { Experimental_DownloadFunction } from 'ai';
import { getAxios } from '../../../request/index.js';

/**
 * AI SDK download function that routes asset downloads through Directus's
 * IP-validated HTTP agent
 */
export const ipValidatedDownload: Experimental_DownloadFunction = async (requestedDownloads) => {
	const axios = await getAxios();

	return Promise.all(
		requestedDownloads.map(async ({ url, isUrlSupportedByModel }) => {
			// Let the provider handle URLs it supports natively (e.g. Google file URIs).
			// The SDK passes these through without downloading
			if (isUrlSupportedByModel) return null;

			// Only http(s) goes through the validated agent
			if (url.protocol !== 'http:' && url.protocol !== 'https:') {
				throw new Error(`Unsupported URL protocol for asset download: "${url.protocol}"`);
			}

			const response = await axios.get<ArrayBuffer>(url.toString(), {
				responseType: 'arraybuffer',
			});

			const contentType = response.headers['content-type'];
			const mediaType = typeof contentType === 'string' ? contentType.split(';')[0]?.trim() : undefined;

			return {
				data: new Uint8Array(response.data),
				mediaType: mediaType || undefined,
			};
		}),
	);
};
