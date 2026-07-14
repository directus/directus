import { toArray } from '@directus/utils';
import { minimatch } from 'minimatch';

export function isMimeTypeAllowed(mimeType: string, patterns: string | string[]): boolean {
	return toArray(patterns).some((pattern) => minimatch(mimeType, pattern));
}
