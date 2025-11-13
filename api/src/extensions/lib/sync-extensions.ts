import { useEnv } from '@directus/env';
import mid from 'node-machine-id';
import { createWriteStream } from 'node:fs';
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import Queue from 'p-queue';
import { useBus } from '../../bus/index.js';
import { useLock } from '../../lock/index.js';
import { useLogger } from '../../logger/index.js';
import { SyncStatus, getSyncStatus, setSyncStatus } from './sync/status.js';
import { ExtensionSyncManager } from './sync/manager.js';

export const syncExtensions = async (options?: { force: boolean }): Promise<void> => {
	const lock = useLock();
	const messenger = useBus();
	const logger = useLogger();
 
	const isSyncing = (await getSyncStatus()) === SyncStatus.SYNCING;

	const machineId = await mid.machineId();
	const machineKey = `extensions-sync/${machineId}`;
await lock.delete(machineKey)
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
		const syncManager = new ExtensionSyncManager();

		await syncManager.ensureLocalDirectoryExists();
		await setSyncStatus(SyncStatus.SYNCING);

		logger.debug('Syncing extensions from configured storage location...');
		const disk = await syncManager.getRemoteDisk();

		// Make sure we don't overload the file handles
		const queue = new Queue({ concurrency: 1000 });

		await syncManager.readLocalFiles();

		for await (const filepath of await syncManager.readRemoteFiles()) {
			// We want files to be stored in the root of `$TEMP_PATH/extensions`, so gotta remove the
			// extensions path on disk from the start of the file path
			const relativePath = relative(resolve(sep, syncManager.remoteRootPath), resolve(sep, filepath));
			const destPath = join(syncManager.localRootPath, relativePath);

			syncManager.setRemoteFile(relativePath);

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

		await syncManager.cleanup();

		await setSyncStatus(SyncStatus.IDLE);

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
