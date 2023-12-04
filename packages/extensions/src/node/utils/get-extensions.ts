import { isTypeIn, listFolders, resolvePackage } from '@directus/utils/node';
import fse from 'fs-extra';
import { pick } from 'lodash-es';
import path from 'path';
import { EXTENSION_PKG_KEY, HYBRID_EXTENSION_TYPES } from '../../shared/constants/index.js';
import { ExtensionManifest } from '../../shared/schemas/index.js';
import type { Extension } from '../../shared/types/index.js';

export const findExtension = async (folder: string, filename: string) => {
	if (await fse.exists(path.join(folder, `${filename}.cjs`))) return `${filename}.cjs`;
	if (await fse.exists(path.join(folder, `${filename}.mjs`))) return `${filename}.mjs`;
	return `${filename}.js`;
};

export async function resolveExtensions(root: string, extensionNames?: string[]): Promise<Extension[]> {
	const extensions: Extension[] = [];

	const local = extensionNames === undefined;

	if (extensionNames === undefined) {
		extensionNames = await listFolders(root);
	}

	for (const extensionName of extensionNames) {
		const extensionPath = local ? path.join(root, extensionName) : resolvePackage(extensionName, root);
		const extensionManifest: Record<string, any> = await fse.readJSON(path.join(extensionPath, 'package.json'));

		let parsedManifest;

		try {
			parsedManifest = ExtensionManifest.parse(extensionManifest);
		} catch (error) {
			throw new Error(`The extension manifest of "${extensionName}" is not valid.\n${error}`);
		}

		const extensionOptions = parsedManifest[EXTENSION_PKG_KEY];

		if (extensionOptions.type === 'bundle') {
			extensions.push({
				path: extensionPath,
				name: parsedManifest.name,
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
				path: extensionPath,
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
				path: extensionPath,
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
				path: extensionPath,
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

const isExtension = async (pkgName: string) => {
	const pkgPath = resolvePackage(pkgName);
	const extensionManifest: Record<string, any> = await fse.readJSON(path.join(pkgPath, 'package.json'));
	return EXTENSION_PKG_KEY in extensionManifest;
};

export async function resolveDependencyExtensions(root: string): Promise<Extension[]> {
	let pkg: { dependencies?: Record<string, string> };

	try {
		pkg = await fse.readJSON(path.resolve(root, 'package.json'));
	} catch {
		throw new Error('Current folder does not contain a package.json file');
	}

	const dependencyNames = Object.keys(pkg.dependencies ?? {});

	const dependencyIsExtensionArray = await Promise.all(dependencyNames.map(isExtension));

	const extensionNames = dependencyNames.filter((_name, index) => dependencyIsExtensionArray[index]);

	return resolveExtensions(root, extensionNames);
}
