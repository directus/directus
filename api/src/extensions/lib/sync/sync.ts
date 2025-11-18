import { useEnv } from "@directus/env";
import mid from 'node-machine-id';
import { createWriteStream } from 'node:fs';
import { mkdir, stat, rm } from 'node:fs/promises';
import { useLock } from "../../../lock/index.js";
import { useBus } from "../../../bus/index.js";
import { useLogger } from "../../../logger/index.js";
import { getSyncStatus, setSyncStatus, SyncStatus } from "./status.js";
import { getExtensionsPath } from "../get-extensions-path.js";
import { dirname, join, relative, resolve, sep } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { getStorage } from "../../../storage/index.js";
import Queue from 'p-queue';
import { SyncFileTracker } from "./tracker.js";

export type ExtensionSyncOptions = {
    forceSync?: boolean; // force sync all extensions
    partialSync?: string; // only sync a specific extension
};

export async function syncExtensions(options?: ExtensionSyncOptions): Promise<void> {
    const env = useEnv();
	const lock = useLock();
	const messenger = useBus();
	const logger = useLogger();

    if (options?.partialSync) {
        logger.debug('Partial sync: ' + options.partialSync);
    } else {
        logger.debug('Full sync');
    }

	if (options?.forceSync !== true && (await getSyncStatus()) === SyncStatus.SYNCING) {
		logger.debug('Extensions are already being synced to this directory from another process.');
		return;
	}

	const machineId = await mid.machineId();
	const machineKey = `extensions-sync/${machineId}`;
	await lock.delete(machineKey);
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

        // determine paths to sync
        const localExtensionsPath = options?.partialSync ? join(getExtensionsPath(), options.partialSync) : getExtensionsPath();
        const remoteExtensionsPath = options?.partialSync ? join(env['EXTENSIONS_PATH'] as string, options.partialSync) : env['EXTENSIONS_PATH'] as string;

        // get the remote storage
        const storage = await getStorage();
        const disk = storage.location(env['EXTENSIONS_LOCATION'] as string);

        // check if we are only removing the local directory
        if (await disk.exists(remoteExtensionsPath) === false) {
            logger.debug('Deleting local extension: ' + localExtensionsPath);
            // remove the local extension and continue to the finally block
            return await rm(localExtensionsPath, { recursive: true, force: true });
        }

        // Make sure we don't overload the file handles
        const queue = new Queue({ concurrency: 1000 });

        // start file tracker
        const fileTracker = new SyncFileTracker();
        // IDEA we can probably check if the local folder is empty here!
        await fileTracker.readLocalFiles(localExtensionsPath);
        const hasLocalFiles = fileTracker.hasLocalFiles();

        for await (const filepath of disk.list(remoteExtensionsPath)) {
            // We want files to be stored in the root of `$TEMP_PATH/extensions`, so gotta remove the
            // extensions path on disk from the start of the file path
            const relativePath = relative(resolve(sep, remoteExtensionsPath), resolve(sep, filepath));
            const destinationPath = join(localExtensionsPath, relativePath);

            await fileTracker.syncFile(relativePath);

            // No need to check metadata when force is enabled
            if (options?.forceSync !== true && hasLocalFiles === false) {
                const localStat = await fsStat(destinationPath);

                if (localStat !== null) {
                    const remoteStat = await disk.stat(filepath);

                    if (localStat && remoteStat.modified <= localStat.modified && remoteStat.size === localStat.size) {
                        // local file exists and is unchanged
                        logger.debug('Skipping sync for:' + relativePath);
                        continue;
                    }
                }
            }

            logger.debug('Downloading file:' + relativePath);

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
        // release lock for other processes
        messenger.publish(machineKey, { ready: true });
        // clear the lock
        await lock.delete(machineKey);
        // remove the status file
        await setSyncStatus(SyncStatus.IDLE);
    }
}

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
