import { EXTENSION_PKG_KEY, HYBRID_EXTENSION_TYPES } from '../../shared/constants/index.js';
import { ExtensionManifest } from '../../shared/schemas/index.js';
import type { Extension } from '../../shared/types/index.js';
import { isTypeIn, listFolders, resolvePackage } from '@directus/utils/node';
import fse from 'fs-extra';
import { pick } from 'lodash-es';
import { join, resolve } from 'path';

export function getExtensionDefinition(manifest: ExtensionManifest, meta: { path: string; local: boolean }): Extension {
	const { name, version } = manifest;
	const { path, local } = meta;
	const extensionOptions = manifest[EXTENSION_PKG_KEY];

	if (extensionOptions.type === 'bundle') {
		return {
			path,
			name,
			partial: extensionOptions.partial,
			version,
			type: extensionOptions.type,
			entrypoint: {
				app: extensionOptions.path.app,
				api: extensionOptions.path.api,
			},
			entries: extensionOptions.entries.map((entry) => pick(entry, 'name', 'type')),
			host: extensionOptions.host,
			local,
		};
	} else if (isTypeIn(extensionOptions, HYBRID_EXTENSION_TYPES)) {
		return {
			path,
			name,
			version,
			type: extensionOptions.type,
			entrypoint: {
				app: extensionOptions.path.app,
				api: extensionOptions.path.api,
			},
			host: extensionOptions.host,
			sandbox: extensionOptions.sandbox,
			local,
		};
	} else if (extensionOptions.type === 'hook' || extensionOptions.type === 'endpoint') {
		return {
			path,
			name,
			version,
			type: extensionOptions.type,
			entrypoint: extensionOptions.path,
			host: extensionOptions.host,
			sandbox: extensionOptions.sandbox,
			local,
		};
	} else {
		// App extensions
		return {
			path,
			name,
			version,
			type: extensionOptions.type,
			entrypoint: extensionOptions.path,
			host: extensionOptions.host,
			local,
		};
	}
}

export async function resolveFsExtensions(root: string): Promise<Map<string, Extension>> {
	root = resolve(root);

	if (!(await fse.exists(root))) return new Map();

	const extensionFolders = await listFolders(root, { ignoreHidden: true });

	const extensionMap = await Promise.all(
		extensionFolders.map(async (folder) => {
			const path = join(root, folder);

			try {
				const manifest: Record<string, any> = await fse.readJSON(join(path, 'package.json'));
				return { name: folder, path, manifest };
			} catch {
				// Ignore invalid extensions or non-extension folders
				return;
			}
		}),
	);

	const extensions = new Map();

	for (const extension of extensionMap.values()) {
		if (!extension) continue;

		const { name, path, manifest } = extension;

		let parsedManifest;

		try {
			parsedManifest = ExtensionManifest.parse(manifest);
		} catch (error) {
			throw new Error(`The manifest of the extension "${name}" (${path}) is invalid.\n${error}`);
		}

		const extensionDefinition = getExtensionDefinition(parsedManifest, { path, local: true });
		extensions.set(name, extensionDefinition);
	}

	return extensions;
}

export async function resolveModuleExtensions(root: string): Promise<Map<string, Extension>> {
	root = resolve(root);

	let pkg: { dependencies?: Record<string, string> };

	try {
		pkg = await fse.readJSON(join(root, 'package.json'));
	} catch {
		throw new Error(`Couldn't resolve package extensions: Path "${root}" does not contain a package.json file`);
	}

	const dependencyNames = Object.keys(pkg.dependencies ?? {});

	const dependencyMap = await Promise.all(
		dependencyNames.map(async (name) => {
			try {
				const path = resolvePackage(name, root);
				const manifest: Record<string, any> = await fse.readJSON(join(path, 'package.json'));
				if (EXTENSION_PKG_KEY in manifest) return { name, path, manifest };
			} catch {
				// Ignore
			}

			// Package cannot be resolved or is not an extension
			return;
		}),
	);

	const extensions = new Map();

	for (const extension of dependencyMap.values()) {
		if (!extension) continue;

		let parsedManifest;

		try {
			parsedManifest = ExtensionManifest.parse(extension.manifest);
		} catch (error) {
			throw new Error(`The manifest of the package extension "${extension.name}" is invalid.\n${error}`);
		}

		const extensionDefinition = getExtensionDefinition(parsedManifest, { path: extension.path, local: true });

		extensions.set(extension.name, extensionDefinition);
	}

	return extensions;
}
