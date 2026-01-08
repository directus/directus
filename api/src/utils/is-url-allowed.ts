import { URL } from 'url';
import { toArray } from '@directus/utils';
import { useLogger } from '../logger/index.js';

/**
 * Check if URL matches allow list either exactly or by origin (protocol+domain+port) + pathname
 */
export default function isUrlAllowed(url: string, allowList: string | string[]): boolean {
	const logger = useLogger();

	const urlAllowList = toArray(allowList);

	if (urlAllowList.includes(url)) return true;

	const parsedWhitelist = urlAllowList
		.map((allowedURL) => {
			try {
				const { origin, pathname } = new URL(allowedURL);
				return origin + pathname;
			} catch {
				logger.warn(`Invalid URL used "${allowedURL}"`);
			}

			return null;
		})
		.filter((f) => f) as string[];

	try {
		const { origin, pathname } = new URL(url);
		return parsedWhitelist.includes(origin + pathname);
	} catch {
		return false;
	}
}
