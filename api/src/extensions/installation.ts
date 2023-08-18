import { EXTENSION_TYPES, ExtensionManifest } from '@directus/constants';
import type { ExtensionManager } from './extensions.js';
import path from 'path';
import fse from 'fs-extra';
import env from '../env.js';
import tar from 'tar';
import { ExtensionsService } from './service.js';
import getDatabase from '../database/index.js';
import { getSchema } from '../utils/get-schema.js';
import type { DatabaseExtensionPermission } from '@directus/types';

export type ExtensionInstallationOptions = {
	version?: string;
	registry?: string;
	granted_permissions?: DatabaseExtensionPermission[]
};

const defaultOptions = {
	registry: 'https://registry.npmjs.org',
	version: 'latest',
};

export class InstallationManager {
	private extensionManager: ExtensionManager;

	constructor(extensionManager: ExtensionManager) {
		this.extensionManager = extensionManager;
	}

	public async installExtension(name: string, options: ExtensionInstallationOptions = {}) {
		options.registry ??= defaultOptions.registry;
		options.version ??= defaultOptions.version;

		if (EXTENSION_TYPES.includes(name as any)) {
			throw new Error(`The name "${name}" is reserved for internal use.`);
		}

		if ((env['EXTENSIONS_ALLOWED_REGISTRIES'] ?? []).includes(options.registry) === false) {
			throw new Error(`The registry "${options.registry}" is not allowed.`);
		}

		const extension = this.extensionManager.getExtension(name);

		if (extension) {
			throw new Error(`Extension "${name}" is already installed.`);
		}

		const axios = (await import('axios')).default;

		const info = await axios.get(
			`${options.registry}/${encodeURIComponent(name)}/${encodeURIComponent(options.version)}`
		);

		const tarballUrl = info.data.dist.tarball;

		try {
			ExtensionManifest.parse(info.data);
		} catch (error) {
			throw new Error(`The package "${name}" is not a valid extension.`);
		}

		const extensionFolder = path.join(env['EXTENSIONS_PATH'], name.replace(/[/\\]/g, '_'));
		const extensionFolderTemp = path.join(env['EXTENSIONS_PATH'], name.replace(/[/\\]/g, '_') + '_temp');
		const localTarPath = path.join(extensionFolderTemp, 'tar.tgz');

		const tarFile = await axios.get(tarballUrl, {
			responseEncoding: 'binary',
			responseType: 'arraybuffer',
		});

		await fse.createFile(localTarPath);

		await fse.writeFile(localTarPath, tarFile.data, {
			encoding: 'binary',
		});

		await tar.extract({
			file: localTarPath,
			cwd: extensionFolderTemp,
		});

		await fse.move(path.join(extensionFolderTemp, 'package'), extensionFolder);
		await fse.remove(extensionFolderTemp);

		const extensionsService = new ExtensionsService({ knex: getDatabase(), schema: await getSchema() });

		await extensionsService.createOne({
			name,
			enabled: true,
			granted_permissions: options.granted_permissions ?? [],
			registry: options.registry,
		});
	}

	public async uninstallExtension(name: string) {
		const extension = this.extensionManager.getExtension(name);

		if (extension === undefined) {
			throw new Error(`Extension "${name}" not found.`);
		}

		if (extension.local === false) {
			throw new Error(`Extension "${name}" is not local.`);
		}

		await fse.remove(path.join(env['EXTENSIONS_PATH'], name.replace(/[/\\]/g, '_')));

		const extensionsService = new ExtensionsService({ knex: getDatabase(), schema: await getSchema() });

		await extensionsService.deleteOne(name);
	}

	public async updateExtension(name: string, options: ExtensionInstallationOptions = {}) {
		options.version ??= defaultOptions.version;
		options.registry ??= defaultOptions.registry;

		const axios = (await import('axios')).default;

		const extension = this.extensionManager.getExtension(name);

		if (extension === undefined) {
			throw new Error(`Extension "${name}" not found.`);
		}

		if (extension.local === false) {
			throw new Error(`Extension "${name}" is a npm dependency.`);
		}

		if ((env['EXTENSIONS_ALLOWED_REGISTRIES'] ?? []).includes(options.registry) === false) {
			throw new Error(`The registry "${options.registry}" is not allowed.`);
		}

		if (options.version === undefined) {
			const info = await axios.get(`${options.registry}/${encodeURIComponent(name)}/latest/`);

			if (info.data.version === extension.version) {
				throw new Error(`Extension "${name}" is already up to date.`);
			}
		}

		if (options.version === extension.version) {
			throw new Error(`Extension "${name}" is already up to date.`);
		}

		await this.uninstallExtension(name);

		await this.installExtension(name, options);
	}
}
