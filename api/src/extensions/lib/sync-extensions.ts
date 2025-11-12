import { useEnv } from '@directus/env';
import { exists } from 'fs-extra';
import mid from 'node-machine-id';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
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
 
	if (!options?.force) {
		const isDone = (await getSyncStatus()) === SyncStatus.DONE;
		if (isDone) return;
	}

	const machineId = await mid.machineId();
	const machineKey = `extensions-sync/${machineId}`;

	const processId = await lock.increment(machineKey);

	const currentProcessShouldHandleSync = processId === 1;

	if (currentProcessShouldHandleSync === false) {
		logger.trace('Extensions already being synced to this machine from another process.');

		// Wait until the process that called the lock publishes a message that the syncing is complete
		return new Promise((resolve) => {
			messenger.subscribe(machineKey, () => resolve());
		});
	}

	try {
		const extensionsPath = getExtensionsPath();
		const storageExtensionsPath = env['EXTENSIONS_PATH'] as string;

		if (await exists(extensionsPath)) {
			// In case the FS still contains the cached extensions from a previous invocation. We have to
			// clear them out to ensure the remote extensions folder remains the source of truth for all
			// extensions that are loaded.


			// DONT REMOVE DURING TESTING IDIOT
			// await rm(extensionsPath, { recursive: true, force: true });
		}

		// Ensure that the local extensions cache path exists
		await mkdir(extensionsPath, { recursive: true });
		await setSyncStatus(SyncStatus.SYNCING);

		logger.trace('Syncing extensions from configured storage location...');

		const storage = await getStorage();

		const disk = storage.location(env['EXTENSIONS_LOCATION'] as string);

		// Make sure we don't overload the file handles
		const queue = new Queue({ concurrency: 1000 });

		const localFiles = (await readdir(extensionsPath, { recursive: true, withFileTypes: true }))
			.filter(dirent => dirent.isFile())
			.map(dirent => join(relative(extensionsPath, dirent.parentPath), dirent.name));

		for await (const filepath of disk.list(storageExtensionsPath)) {
			// We want files to be stored in the root of `$TEMP_PATH/extensions`, so gotta remove the
			// extensions path on disk from the start of the file path
			const relativePath = relative(resolve(sep, storageExtensionsPath), resolve(sep, filepath));
			const destPath = join(extensionsPath, relativePath);

			const localFileIndex = localFiles.findIndex(f => f === relativePath);
			if (localFileIndex >= 0) localFiles.splice(localFileIndex);

			const remoteStat = await disk.stat(filepath);		
			const localStat = await fsStat(destPath);
			
			if (localStat && remoteStat.modified <= localStat.modified && remoteStat.size === localStat.size) {
				// local file exists and is unchanged
				// eslint-disable-next-line no-console
				console.info('Skipping sync for:', relativePath);
				continue;
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

		// any localFiles left exist locally but not remote
		for (const removeFile of localFiles) {
			const removePath = join(extensionsPath, removeFile);

			// eslint-disable-next-line no-console
			console.info('Removing: ', removePath);
			
			await rm(removePath, { force: true })
				.catch(() => {/* ignore file removal error? */});
		}

		// No longer needed because the above loop removes the file!
		// await setSyncStatus(SyncStatus.DONE);

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