import { access } from 'node:fs/promises';

/**
 * Check whether a file or directory exists at the given path
 */
export async function pathExists(path: string): Promise<boolean> {
	try {
		await access(path);
		return true;
	} catch {
		return false;
	}
}
