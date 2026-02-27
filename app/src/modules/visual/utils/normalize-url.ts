import { parseUrl } from '@/utils/parse-url';

export function normalizeUrl(url: string): string {
	const parsed = parseUrl(url);
	if (!parsed) return '';

	return parsed.href.replace(/\/$/, '');
}
