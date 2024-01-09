import { isTypeIn, listFolders, resolvePackage } from '@directus/utils/node';
import fse from 'fs-extra';
import { pick } from 'lodash-es';
import { join, resolve } from 'path';
import { EXTENSION_PKG_KEY, HYBRID_EXTENSION_TYPES } from '../../shared/constants/index.js';
import { ExtensionManifest } from '../../shared/schemas/index.js';
import type { Extension } from '../../shared/types/index.js';

type ExtensionList = [name: string, path: string][];

export async function getExtensions(extensionList: ExtensionList, local: boolean): Promise<Extension[]> {
	const extensions: Extension[] = [];

	for (const [name, path] of extensionList) {
		const packageJsonPath = join(path, 'package.json');

		const pkgExists = await fse.exists(packageJsonPath);

		if (pkgExists === false) {
			throw new Error(`${local ? 'Local' : 'Package'} extension "${name}" does not contain a package.json file.`);
		}

		const extensionManifest: Record<string, any> = await fse.readJSON(packageJsonPath);

		let parsedManifest;

		try {
			parsedManifest = ExtensionManifest.parse(extensionManifest);
		} catch (error) {
			throw new Error(`The manifest of ${local ? 'local' : 'package'} extension "${name}" is invalid.\n${error}`);
		}

		const extensionOptions = parsedManifest[EXTENSION_PKG_KEY];

		if (extensionOptions.type === 'bundle') {
			extensions.push({
				path,
				name: parsedManifest.name,
				partial: extensionOptions.partial,
				version: parsedManifest.version,
				type: extensionOptions.type,
				entrypoint: {
					app: extensionOptions.path.app,
					api: extensionOptions.path.api,
				},
				entries: extensionOptions.entries.map((entry) => pick(entry, 'name', 'type')),
				host: extensionOptions.host,
				local,
			});
		} else if (isTypeIn(extensionOptions, HYBRID_EXTENSION_TYPES)) {
			extensions.push({
				path,
				name: parsedManifest.name,
				version: parsedManifest.version,
				type: extensionOptions.type,
				entrypoint: {
					app: extensionOptions.path.app,
					api: extensionOptions.path.api,
				},
				host: extensionOptions.host,
				sandbox: extensionOptions.sandbox,
				local,
			});
		} else if (extensionOptions.type === 'hook' || extensionOptions.type === 'endpoint') {
			extensions.push({
				path,
				name: parsedManifest.name,
				version: parsedManifest.version,
				type: extensionOptions.type,
				entrypoint: extensionOptions.path,
				host: extensionOptions.host,
				sandbox: extensionOptions.sandbox,
				local,
			});
		} else {
			// App extensions
			extensions.push({
				path,
				name: parsedManifest.name,
				version: parsedManifest.version,
				type: extensionOptions.type,
				entrypoint: extensionOptions.path,
				host: extensionOptions.host,
				local,
			});
		}
	}

	return extensions;
}

export async function resolveLocalExtensions(root: string): Promise<Extension[]> {
	const extensionFolders = await listFolders(root);

	const extensionList: ExtensionList = extensionFolders.map((folder) => [folder, join(root, folder)]);

	return getExtensions(extensionList, false);
}

const isExtension = (pkgName: string) => {
	const regex = /^(?:(?:@[^/]+\/)?directus-extension-|@directus\/extension-)(.+)$/;
	return regex.test(pkgName);
};

export async function resolvePackageExtensions(root: string): Promise<Extension[]> {
	let pkg: { dependencies?: Record<string, string> };

	try {
		pkg = await fse.readJSON(resolve(root, 'package.json'));
	} catch {
		throw new Error(`Couldn't resolve package extensions: Path "${root}" does not contain a package.json file`);
	}

	const dependencyNames = Object.keys(pkg.dependencies ?? {});

	const extensionNames = dependencyNames.filter((name) => isExtension(name));

	const extensionList: ExtensionList = extensionNames.map((pkgName) => [pkgName, resolvePackage(pkgName, root)]);

	return getExtensions(extensionList, true);
}
