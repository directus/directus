import { join, relative, resolve, sep } from 'node:path';
import { stat } from 'node:fs/promises';
import { getExtensionsPath } from '../get-extensions-path.js';
import { useEnv } from '@directus/env';
import type { Driver } from '@directus/storage';

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

/**
 * Builds up the local and remote paths to use with syncing
 */
export function getSyncPaths(partialPath: string | undefined) {
	const env = useEnv();
	const localRootPath = getExtensionsPath();
	const remoteRootPath = env['EXTENSIONS_PATH'] as string;

	if (!partialPath) {
		return {
			localExtensionsPath: localRootPath,
			remoteExtensionsPath: remoteRootPath,
		};
	}

	const resolvedPartialPath = relative(sep, resolve(sep, partialPath));
	return {
		localExtensionsPath: join(localRootPath, resolvedPartialPath),
		remoteExtensionsPath: join(remoteRootPath, resolvedPartialPath),
	};
}

/**
 * Retrieve the stats for local and remote files and check if they are the same
 * Returns false if files are differnt else true
 */
export async function compareFileMetadata(localPath: string, remotePath: string, disk: Driver): Promise<boolean> {
	const localStat = await fsStat(localPath).catch(() => {});
    if (!localStat) return false;

    const remoteStat = await disk.stat(remotePath).catch(() => {});
    if (!remoteStat) return false;

    return remoteStat.modified <= localStat.modified && remoteStat.size === localStat.size;
}
