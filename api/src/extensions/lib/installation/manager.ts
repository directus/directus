import { useEnv } from '@directus/env';
import { ForbiddenError } from '@directus/errors';
import { EXTENSION_PKG_KEY, ExtensionManifest } from '@directus/extensions';
import { download, type DownloadOptions } from '@directus/extensions-registry';
import DriverLocal from '@directus/storage-driver-local';
import { move } from 'fs-extra';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile, rm } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import Queue from 'p-queue';
import { join } from 'path';
import type { ReadableStream } from 'stream/web';
import tar from 'tar';
import { useLogger } from '../../../logger.js';
import { getStorage } from '../../../storage/index.js';
import { getExtensionsPath } from '../get-extensions-path.js';
import { ServiceUnavailableError } from '@directus/errors';

const env = useEnv();

export class InstallationManager {
	extensionPath = getExtensionsPath();
	driverLocal: DriverLocal = new DriverLocal({ root: this.extensionPath });
	async install(versionId: string) {
		const logger = useLogger();

		const downloadPath = join('directus_install_temp', versionId);

		//temp dir inside extension folder to download and extract the tar
		const tempDir = join(this.extensionPath, downloadPath);
		await mkdir(tempDir, { recursive: true });

		const options: DownloadOptions = {};

		if (env['MARKETPLACE_REGISTRY'] && typeof env['MARKETPLACE_REGISTRY'] === 'string') {
			options.registry = env['MARKETPLACE_REGISTRY'];
		}

		const tarReadableStream = await download(versionId, options);

		if (!tarReadableStream) {
			throw new ForbiddenError();
		}

		const tarStream = Readable.fromWeb(tarReadableStream as ReadableStream);

		try {
			const tarPath = join(tempDir, `bin.tar.tgz`);
			const writeStream = createWriteStream(tarPath, { encoding: 'binary' });
			await pipeline(tarStream, writeStream);

			await tar.extract({
				file: tarPath,
				cwd: tempDir,
			});

			const packageFile = JSON.parse(await readFile(join(tempDir, 'package', 'package.json'), { encoding: 'utf-8' }));
			const extensionManifest = ExtensionManifest.parse(packageFile);

			if (!extensionManifest[EXTENSION_PKG_KEY]?.type) {
				throw new Error(`Extension type not found in package.json`);
			}

			if (env['EXTENSIONS_LOCATION']) {
				// Upload the extension into the configured extensions location
				const storage = await getStorage();
				const remoteDisk = storage.location(env['EXTENSIONS_LOCATION'] as string);
				const prefix = join(downloadPath, 'package');

				const queue = new Queue({ concurrency: 1000 });

				for await (const filepath of this.driverLocal.list(prefix)) {
					const readStream = await this.driverLocal.read(filepath);
					const remotePath = join(env['EXTENSIONS_PATH'] as string, versionId, filepath.split(prefix)[1]!);
					queue.add(() => remoteDisk.write(remotePath, readStream));
				}

				await queue.onIdle();
			} else {
				// No custom location, so save to regular local extensions folder
				const dest = join(this.extensionPath, versionId);
				await move(join(tempDir, 'package'), dest, { overwrite: true });
			}
		} catch (err) {
			logger.warn(err);

			throw new ServiceUnavailableError(
				{ service: 'marketplace', reason: 'Could not download and extract the extension' },
				{ cause: err },
			);
		} finally {
			// Remove the temporary dir no matter what
			await rm(tempDir, { recursive: true });
		}
	}
}
