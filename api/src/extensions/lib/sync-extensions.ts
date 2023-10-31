import { machineId } from 'node-machine-id';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join, normalize } from 'node:path';
import { pipeline } from 'node:stream/promises';
import Queue from 'p-queue';
import { getEnv } from '../../env.js';
import logger from '../../logger.js';
import { getMessenger } from '../../messenger.js';
import { getStorage } from '../../storage/index.js';
import { getExtensionsPath } from './get-extensions-path.js';
import { SyncStatus, getSyncStatus, setSyncStatus } from './sync-status.js';

export const syncExtensions = async () => {
	const messenger = getMessenger();

	const isPrimaryProcess =
		String(process.env['NODE_APP_INSTANCE']) === '0' || process.env['NODE_APP_INSTANCE'] === undefined;

	const isDone = (await getSyncStatus()) === SyncStatus.DONE;

	const id = await machineId();

	const message = `extensions-sync/${id}`;

	if (isDone === false && isPrimaryProcess === false) {
		logger.trace('Extensions already being synced to this machine from another process.');

		/**
		 * Wait until the process that called the lock publishes a message that the syncing is complete
		 */
		return new Promise((resolve) => {
			messenger.subscribe(message, resolve);
		});
	}

	const env = getEnv();

	if (!env['EXTENSIONS_LOCATION']) {
		return;
	}

	logger.trace('Syncing extensions from configured storage location...');

	const storage = await getStorage();

	const disk = storage.location(env['EXTENSIONS_LOCATION']);

	// Make sure we don't overload the file handles
	const queue = new Queue({ concurrency: 1000 });

	for await (const filepath of disk.list(env['EXTENSIONS_PATH'])) {
		const readStream = await disk.read(filepath);

		// We want files to be stored in the root of `$TEMP_PATH/extensions`, so gotta remove the
		// extensions path on disk from the start of the file path
		const destPath = join(getExtensionsPath(), filepath.substring(normalize(env['EXTENSIONS_PATH']).length));

		// Ensure that the directory path exists
		await mkdir(dirname(destPath), { recursive: true });

		const writeStream = createWriteStream(destPath);

		queue.add(() => pipeline(readStream, writeStream));
	}

	await queue.onIdle();

	await setSyncStatus(SyncStatus.DONE);
	messenger.publish(message, { ready: true });

	return;
};
