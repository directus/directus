import { sep } from 'node:path';
import { stat } from 'node:fs/promises';

/**
 * Returns the directory depth of the provided path
 */
export function pathDepth(path: string): number {
	let count = 0;

	for (let i = 0; i < path.length; i++) {
		if (path[i] === sep) count++;
	}

	return count;
}

/**
 * Reads the size and modified date of a file if it exists
 */
export async function fsStat(path: string) {
	const data = await stat(path, { bigint: false }).catch(() => {
		/* file not available */
	});

	if (!data) return null;
	return {
		size: data.size,
		modified: data.mtime,
	};
}

