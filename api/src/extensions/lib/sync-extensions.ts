import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import Queue from 'p-queue';
import { getEnv } from '../../env.js';
import logger from '../../logger.js';
import { getStorage } from '../../storage/index.js';
import { getExtensionsPath } from './get-extensions-path.js';

export const syncExtensions = async () => {
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
		const destPath = join(getExtensionsPath(), filepath.substring(env['EXTENSIONS_PATH'].length));

		// Ensure that the directory path exists
		await mkdir(dirname(destPath), { recursive: true });

		const writeStream = createWriteStream(destPath);

		await queue.add(() => pipeline(readStream, writeStream));
	}
};
