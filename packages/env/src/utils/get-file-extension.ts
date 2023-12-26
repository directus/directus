import { extname } from 'node:path';

/**
 * Returns the file extension of a given file
 */
export const getFileExtension = (path: string) => {
	return extname(path).toLowerCase().substring(1);
};
