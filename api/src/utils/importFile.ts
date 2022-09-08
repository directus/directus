import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Loads a file from the source directory
 * @param file The filename to load
 * @returns The loaded file
 */
export function importFile(file: string) {
	return readFileSync(getImportFilePath(file), 'utf8');
}

export function getImportFilePath(file: string) {
	return path.join(path.dirname(fileURLToPath(import.meta.url)), '/../', file);
}
