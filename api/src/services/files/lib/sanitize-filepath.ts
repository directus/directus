import path from 'node:path';
import { normalizePath } from '@directus/utils';

/**
 * Sanitize a filepath to its a safe relative path
 *
 * @param filepath - The filepath
 */
export function sanitizeFilepath(filepath: string): string {
	return normalizePath(path.relative(path.sep, path.resolve(path.sep, filepath)));
}
