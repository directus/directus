import Queue from 'p-queue';
import mid from 'node-machine-id';
import { useEnv } from '@directus/env';
import { createWriteStream } from 'node:fs';
import { mkdir, rm } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { getSyncPaths, compareFileMetadata } from './utils.js';
import { useBus } from '../../../bus/index.js';
import { SyncFileTracker } from './tracker.js';
import { useLock } from '../../../lock/index.js';
import { useLogger } from '../../../logger/index.js';
import { getStorage } from '../../../storage/index.js';
import { getExtensionsPath } from '../get-extensions-path.js';
import { isSynchronizing, setSyncStatus, SyncStatus } from './status.js';
import { normalizePath } from '@directus/utils';

export type ExtensionSyncOptions = {
	forceSync?: boolean; // force sync all extensions
	partialSync?: string; // only sync a specific extension
};

export async function syncExtensions(options?: ExtensionSyncOptions): Promise<void> {
	const env = useEnv();
	const lock = useLock();
	const messenger = useBus();
	const logger = useLogger();

	if (options?.forceSync !== true && (await isSynchronizing())) {
		logger.debug('Extensions are already being synced to this directory from another process.');
		return;
	}

	const machineId = await mid.machineId();
	const machineKey = `extensions-sync/${machineId}`;
	const processId = await lock.increment(machineKey);

	if (processId !== 1) {
		logger.debug('Extensions are already being synced to this machine from another process.');

		// Wait until the process that called the lock publishes a message that the syncing is complete
		return new Promise((resolve) => {
			messenger.subscribe(machineKey, () => resolve());
		});
	}

	try {
		logger.debug('Syncing extensions from configured storage location...');

		// Ensure that the local extensions cache path exists
		await mkdir(getExtensionsPath(), { recursive: true });
		await setSyncStatus(SyncStatus.SYNCING);

		const { localExtensionsPath, remoteExtensionsPath } = getSyncPaths(options?.partialSync);

		const storage = await getStorage();
		const disk = storage.location(env['EXTENSIONS_LOCATION'] as string);

		// check if we are only removing the local directory
		if (options?.partialSync) {
			const remoteExists = await disk.exists(normalizePath(join(remoteExtensionsPath, 'package.json')));

			if (remoteExists === false) {
				await rm(localExtensionsPath, { recursive: true, force: true });
				return;
			}
		}

		// Make sure we don't overload the file handles
		const queue = new Queue({ concurrency: 1000 });

		// start file tracker
		const fileTracker = new SyncFileTracker();
		const localFileCount = await fileTracker.readLocalFiles(localExtensionsPath);
		const hasLocalFiles = localFileCount > 0;

		for await (const filepath of disk.list(remoteExtensionsPath)) {
			// We want files to be stored in the root of `$TEMP_PATH/extensions`, so gotta remove the
			// extensions path on disk from the start of the file path
			const relativePath = relative(resolve(sep, remoteExtensionsPath), resolve(sep, filepath));
			const destinationPath = join(localExtensionsPath, relativePath);

			await fileTracker.passedFile(relativePath);

			// No need to check metadata when force is enabled
			if (options?.forceSync !== true && hasLocalFiles) {
				const fileUnchanged = await compareFileMetadata(destinationPath, filepath, disk);
				if (fileUnchanged) continue;
			}

			// Ensure that the directory path exists
			await mkdir(dirname(destinationPath), { recursive: true });

			// write remote file to the local filesystem
			const readStream = await disk.read(filepath);
			const writeStream = createWriteStream(destinationPath);
			queue.add(() => pipeline(readStream, writeStream));
		}

		// wait for the queue to finish
		await queue.onIdle();
		// cleanup dangling local files
		await fileTracker.cleanup(localExtensionsPath);
	} finally {
		// release various locking mechanisms
		messenger.publish(machineKey, { ready: true });
		await lock.delete(machineKey);
		await setSyncStatus(SyncStatus.IDLE);
	}
}
