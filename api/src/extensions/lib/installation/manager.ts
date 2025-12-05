import { useEnv } from '@directus/env';
import { ErrorCode, isDirectusError, ServiceUnavailableError } from '@directus/errors';
import { EXTENSION_PKG_KEY, ExtensionManifest } from '@directus/extensions';
import { download, type DownloadOptions } from '@directus/extensions-registry';
import DriverLocal from '@directus/storage-driver-local';
import { move, remove } from 'fs-extra';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { Readable } from 'node:stream';
import Queue from 'p-queue';
import { join } from 'path';
import type { ReadableStream } from 'stream/web';
import { extract } from 'tar';
import { useLogger } from '../../../logger/index.js';
import { getStorage } from '../../../storage/index.js';
import { getExtensionsPath } from '../get-extensions-path.js';

const env = useEnv();

export class InstallationManager {
	extensionPath = getExtensionsPath();

	async install(versionId: string) {
		const logger = useLogger();
		const tempDir = join(env['TEMP_PATH'] as string, 'marketplace', versionId);
		const tmpStorage = new DriverLocal({ root: tempDir });

		try {
			await mkdir(tempDir, { recursive: true });

			const options: DownloadOptions = {};

			if (env['MARKETPLACE_REGISTRY'] && typeof env['MARKETPLACE_REGISTRY'] === 'string') {
				options.registry = env['MARKETPLACE_REGISTRY'];
			}

			let tarReadableStream;

			try {
				tarReadableStream = await download(versionId, env['MARKETPLACE_TRUST'] === 'sandbox', options);
			} catch (error) {
				throw new ServiceUnavailableError(
					{ service: 'marketplace', reason: 'Could not download the extension' },
					{ cause: error },
				);
			}

			if (!tarReadableStream) {
				throw new Error(`No readable stream returned from download`);
			}

			const tarStream = Readable.fromWeb(tarReadableStream as ReadableStream);
			const tarPath = join(tempDir, `bin.tar.tgz`);
			await tmpStorage.write('bin.tar.tgz', tarStream);

			/**
			 * NPM modules that are packed are always tarballed in a folder called "package"
			 */
			const extractedPath = 'package';

			await extract({
				file: tarPath,
				cwd: tempDir,
			});

			const packageFile = JSON.parse(
				await readFile(join(tempDir, extractedPath, 'package.json'), { encoding: 'utf-8' }),
			);

			const extensionManifest = await ExtensionManifest.parseAsync(packageFile);

			if (!extensionManifest[EXTENSION_PKG_KEY]?.type) {
				throw new Error(`Extension type not found in package.json`);
			}

			if (env['EXTENSIONS_LOCATION']) {
				// Upload the extension into the configured extensions location
				const storage = await getStorage();
				const remoteDisk = storage.location(env['EXTENSIONS_LOCATION'] as string);

				const queue = new Queue({ concurrency: 1000 });

				for await (const filepath of tmpStorage.list(extractedPath)) {
					const readStream = await tmpStorage.read(filepath);

					const remotePath = join(
						env['EXTENSIONS_PATH'] as string,
						'.registry',
						versionId,
						filepath.substring(extractedPath.length),
					);

					queue.add(() => remoteDisk.write(remotePath, readStream));
				}

				await queue.onIdle();
			}

			// move to regular local extensions folder
			const dest = join(this.extensionPath, '.registry', versionId);
			await move(join(tempDir, extractedPath), dest, { overwrite: true });
		} catch (err) {
			logger.warn(err);

			// rethrow marketplace servic unavailable
			if (isDirectusError(err, ErrorCode.ServiceUnavailable)) {
				throw err;
			}

			throw new ServiceUnavailableError(
				{ service: 'extensions', reason: 'Failed to extract the extension or write it to storage' },
				{ cause: err },
			);
		} finally {
			await rm(tempDir, { recursive: true });
		}
	}

	async uninstall(folder: string) {
		if (env['EXTENSIONS_LOCATION']) {
			const storage = await getStorage();
			const remoteDisk = storage.location(env['EXTENSIONS_LOCATION'] as string);

			const queue = new Queue({ concurrency: 1000 });

			const prefix = join(env['EXTENSIONS_PATH'] as string, '.registry', folder);

			for await (const filepath of remoteDisk.list(prefix)) {
				queue.add(() => remoteDisk.delete(filepath));
			}

			await queue.onIdle();
		}

		const path = join(this.extensionPath, '.registry', folder);
		await remove(path);
	}
}
