import { useEnv } from '@directus/env';
import mid from 'node-machine-id';
import { createWriteStream } from 'node:fs';
import { mkdir, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import Queue from 'p-queue';
import { useBus } from '../../bus/index.js';
import { useLock } from '../../lock/index.js';
import { useLogger } from '../../logger/index.js';
import { SyncStatus, getSyncStatus, setSyncStatus } from './sync/status.js';
import { SyncFileTracker } from './sync/tracker.js';
import { getExtensionsPath } from './get-extensions-path.js';
import { getStorage } from '../../storage/index.js';

export async function syncExtensions(options?: { force: boolean }): Promise<void> {
	const env = useEnv();
	const lock = useLock();
	const messenger = useBus();
	const logger = useLogger();
 
	const isSyncing = (await getSyncStatus()) === SyncStatus.SYNCING;

	const machineId = await mid.machineId();
	const machineKey = `extensions-sync/${machineId}`;
// await lock.delete(machineKey)
	const processId = await lock.increment(machineKey);

	console.log(machineId, processId);

	if (processId !== 1 || isSyncing) {
		logger.debug('Extensions already being synced to this machine from another process.');

		// Wait until the process that called the lock publishes a message that the syncing is complete
		return new Promise((resolve) => {
			messenger.subscribe(machineKey, () => resolve());
		});
	}

	try {
		logger.debug('Syncing extensions from configured storage location...');

		const localExtensionsPath = getExtensionsPath();
		const remoteExtensionsPath = env['EXTENSIONS_PATH'] as string;

		// Ensure that the local extensions cache path exists
		await mkdir(localExtensionsPath, { recursive: true });
		await setSyncStatus(SyncStatus.SYNCING);

		const disk = await getRemoteDisk(env['EXTENSIONS_LOCATION'] as string);

		// Make sure we don't overload the file handles
		const queue = new Queue({ concurrency: 1000 });

		const fileTracker = new SyncFileTracker();
		await fileTracker.readLocalFiles(localExtensionsPath);

		for await (const filepath of disk.list(remoteExtensionsPath)) {
			// We want files to be stored in the root of `$TEMP_PATH/extensions`, so gotta remove the
			// extensions path on disk from the start of the file path
			const relativePath = relative(resolve(sep, remoteExtensionsPath), resolve(sep, filepath));
			const destinationPath = join(localExtensionsPath, relativePath);

			await fileTracker.syncFile(relativePath);

			if (options?.force !== true) {
				// dont bother checking meta info when force is enabled
				const remoteStat = await disk.stat(filepath);
				const localStat = await fsStat(destinationPath);
				
				if (localStat && remoteStat.modified <= localStat.modified && remoteStat.size === localStat.size) {
					// local file exists and is unchanged
					// eslint-disable-next-line no-console
					console.info('Skipping sync for:', relativePath);
					continue;
				}
			}

			// eslint-disable-next-line no-console
			console.info('Syncing:', relativePath);
			
			// Ensure that the directory path exists
			await mkdir(dirname(destinationPath), { recursive: true });

			const readStream = await disk.read(filepath);
			const writeStream = createWriteStream(destinationPath);
			queue.add(() => pipeline(readStream, writeStream));
		}

		await queue.onIdle();

		await fileTracker.cleanup(localExtensionsPath);

		messenger.publish(machineKey, { ready: true });
	} finally {
		await lock.delete(machineKey);
		await setSyncStatus(SyncStatus.IDLE);
	}
}

async function getRemoteDisk(location: string) {
	const storage = await getStorage();
	return storage.location(location);
}

async function fsStat(path: string) {
	const data = await stat(path, { bigint: false })
		.catch(() => {/* file not available */});
	
	if (!data) return null;
	return {
		size: data.size,
		modified: data.mtime
	};
}
