import { useEnv } from '@directus/env';
import axios from 'axios';
import tar from 'tar';
import Queue from 'p-queue';
import { join } from 'path';
import { getStorage } from '../../../storage/index.js';
import { getExtensionsPath } from '../get-extensions-path.js';
import { mkdir, rm, readFile } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import DriverLocal from '@directus/storage-driver-local';
import { createWriteStream } from 'node:fs';
import { move } from 'fs-extra';
import { EXTENSION_PKG_KEY, ExtensionManifest } from '@directus/extensions';

const registryMap: Record<string, string> = {
	npm: 'https://registry.npmjs.org',
	yarn: 'https://registry.yarnpkg.com',
	github: 'https://npm.pkg.github.com',
};

const env = useEnv();

export class InstallationManager {
	extensionPath = getExtensionsPath();
	driverLocal: DriverLocal = new DriverLocal({ root: this.extensionPath });
	async install(name: string, version?: string, registry?: string) {
		version ??= 'latest';
		const registryUrl = registryMap[registry || (env['EXTENSIONS_REGISTRY'] as string)];
		const packageUrl = `${registryUrl}/${name}/${version}`;
		const token = env['EXTENSIONS_REGISTRY_TOKEN'];

		const headers = {
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		};

		const packageInfo = await axios.get(packageUrl, {
			headers,
		});

		const downloadPath = join('directus_install_temp', name);

		//temp dir inside extension folder to download and extract the tar
		const tempDir = join(this.extensionPath, downloadPath);
		await mkdir(tempDir, { recursive: true });

		const tarStream = await axios.get(packageInfo.data.dist.tarball, {
			headers,
			responseEncoding: 'binary',
			responseType: 'stream',
		});

		try {
			const tarPath = join(tempDir, `bin.tar.tgz`);
			const writeStream = createWriteStream(tarPath, { encoding: 'binary' });
			await pipeline(tarStream.data, writeStream);

			await tar.extract({
				file: tarPath,
				cwd: tempDir,
			});

			const packageFile = JSON.parse(await readFile(join(tempDir, 'package', 'package.json'), { encoding: 'utf-8' }));
			const extensionManifest = ExtensionManifest.parse(packageFile);

			if (!extensionManifest.name) {
				throw new Error(`Extension name not found in package.json`);
			}

			if (!extensionManifest[EXTENSION_PKG_KEY]?.type) {
				throw new Error(`Extension type not found in package.json`);
			}

			if (!env['EXTENSIONS_LOCATION']) {
				//no locations configurred hence just move the extracted tar to extension folder
				const dest = join(this.extensionPath, name);
				await move(join(tempDir, 'package'), dest, { overwrite: true });
			} else {
				//upload the temp dir into configurred extension location
				const storage = await getStorage();
				const remoteDisk = storage.location(env['EXTENSIONS_LOCATION'] as string);
				const prefix = join(downloadPath, 'package');

				const queue = new Queue({ concurrency: 1000 });

				for await (const filepath of this.driverLocal.list(prefix)) {
					const readStream = await this.driverLocal.read(filepath);
					const remotePath = join(env['EXTENSIONS_PATH'] as string, name, filepath.split(prefix)[1]!);
					queue.add(() => remoteDisk.write(remotePath, readStream));
				}

				await queue.onIdle();
			}
		} finally {
			//just remove the package directory
			await rm(tempDir, { recursive: true });
		}
	}
}
