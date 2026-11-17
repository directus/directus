import { extname } from 'node:path';

/**
 * Returns the file extension of a given file path
 */
export function getFileExtension(path: string): string {
	return extname(path).toLowerCase().substring(1);
}
