import { useEnv } from '@directus/env';
import { exists } from 'fs-extra';
import mid from 'node-machine-id';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, rm, rmdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import Queue from 'p-queue';
import { useBus } from '../../bus/index.js';
import { useLock } from '../../lock/index.js';
import { useLogger } from '../../logger/index.js';
import { getStorage } from '../../storage/index.js';
import { getExtensionsPath } from './get-extensions-path.js';
import { SyncStatus, getSyncStatus, setSyncStatus } from './sync-status.js';

export const syncExtensions = async (options?: { force: boolean }): Promise<void> => {
	const lock = useLock();
	const messenger = useBus();
	const env = useEnv();
	const logger = useLogger();
 
	const isSyncing = (await getSyncStatus()) === SyncStatus.SYNCING;

	const machineId = await mid.machineId();
	const machineKey = `extensions-sync/${machineId}`;
// await lock.delete(machineKey)
	const processId = await lock.increment(machineKey);

	const currentProcessShouldHandleSync = processId === 1;

	console.log(machineId, processId);

	if (currentProcessShouldHandleSync === false || isSyncing) {
		logger.debug('Extensions already being synced to this machine from another process.');

		// Wait until the process that called the lock publishes a message that the syncing is complete
		return new Promise((resolve) => {
			messenger.subscribe(machineKey, () => resolve());
		});
	}

	try {
		const extensionsPath = getExtensionsPath();
		const storageExtensionsPath = env['EXTENSIONS_PATH'] as string;

		// Ensure that the local extensions cache path exists
		await mkdir(extensionsPath, { recursive: true });
		await setSyncStatus(SyncStatus.SYNCING);

		logger.debug('Syncing extensions from configured storage location...');

		const storage = await getStorage();

		const disk = storage.location(env['EXTENSIONS_LOCATION'] as string);

		// Make sure we don't overload the file handles
		const queue = new Queue({ concurrency: 1000 });

		const remoteFiles = new Set<string>();

		const localFiles = (await readdir(extensionsPath, { recursive: true, withFileTypes: true }))
			.filter(dirent => dirent.isFile())
			.map(dirent => join(relative(extensionsPath, dirent.parentPath), dirent.name));

		console.log(localFiles);

		for await (const filepath of disk.list(storageExtensionsPath)) {
			// We want files to be stored in the root of `$TEMP_PATH/extensions`, so gotta remove the
			// extensions path on disk from the start of the file path
			const relativePath = relative(resolve(sep, storageExtensionsPath), resolve(sep, filepath));
			const destPath = join(extensionsPath, relativePath);

			remoteFiles.add(relativePath);

			const localFileIndex = localFiles.findIndex(f => f === relativePath);
			if (localFileIndex >= 0) localFiles.splice(localFileIndex, 1);

			if (options?.force !== true) {
				// dont bother checking meta info when force is enabled
				const remoteStat = await disk.stat(filepath);
				const localStat = await fsStat(destPath);
				
				if (localStat && remoteStat.modified <= localStat.modified && remoteStat.size === localStat.size) {
					// local file exists and is unchanged
					// eslint-disable-next-line no-console
					console.info('Skipping sync for:', relativePath);
					continue;
				}
			}

			// eslint-disable-next-line no-console
			console.info('Syncing:', relativePath);
			
			const readStream = await disk.read(filepath);

			// Ensure that the directory path exists
			await mkdir(dirname(destPath), { recursive: true });

			const writeStream = createWriteStream(destPath);

			queue.add(() => pipeline(readStream, writeStream));
		}

		await queue.onIdle();

		// Now we can determine which directories will be empty
		const dirsWithRemoteFiles = new Set<string>();

		// Track all directories that contain remote files
		for (const remoteFile of remoteFiles) {
			let currentDir = dirname(join(extensionsPath, remoteFile));

			while (currentDir !== extensionsPath) {
				dirsWithRemoteFiles.add(currentDir);
				currentDir = dirname(currentDir);
			}
		}

		// Collect all directories from files we're removing
		const removeDirs = new Set<string>();

		for (const removeFile of localFiles) {
			if (removeFile === '.status') continue;

			const removePath = join(extensionsPath, removeFile);
			let currentDir = dirname(removePath);

			while (currentDir !== extensionsPath) {
				removeDirs.add(currentDir);
				currentDir = dirname(currentDir);
			}
		}

		// Find directories that can be removed recursively (no remote files in them or subdirectories)
		const dirsToRemoveRecursively = Array.from(removeDirs)
			.filter(dir => !dirsWithRemoteFiles.has(dir))
			.sort((a, b) => pathDepth(a) - pathDepth(b)); // Shallowest first

		console.log(dirsToRemoveRecursively);

		// Remove entire directory trees at once
		const removedDirs = new Set<string>();

		for (const removeDir of dirsToRemoveRecursively) {
			// Skip if already removed as part of a parent directory
			let alreadyRemoved = false;

			for (const removed of removedDirs) {
				if (removeDir.startsWith(removed + sep)) {
					alreadyRemoved = true;
					break;
				}
			}

			if (!alreadyRemoved) {
				console.log('removing dir recursively:', removeDir);

				await rm(removeDir, { recursive: true, force: true })
					.catch((e) => { console.error('e2', e); });

				removedDirs.add(removeDir);
			}
		}

		await setSyncStatus(SyncStatus.DONE);

		messenger.publish(machineKey, { ready: true });
	} finally {
		await lock.delete(machineKey);
	}
};


async function fsStat(path: string) {
	const data = await stat(path, { bigint: false })
		.catch(() => {/* file not available */});
	
	if (!data) return null;
	return {
		size: data.size,
		modified: data.mtime
	};
}

function pathDepth(path: string): number {
	let count = 0;

	for (let i = 0; i < path.length; i++) {
		if (path[i] === sep) count++;
	}

	return count;
}