import {
	EXTENSION_NAME_REGEX,
	EXTENSION_PKG_KEY,
	HYBRID_EXTENSION_TYPES,
	ExtensionManifest,
} from '@directus/constants';
import type { Extension } from '@directus/types';
import fse from 'fs-extra';
import path, { sep } from 'path';
import { isTypeIn } from './array-helpers.js';
import { resolvePackage } from './resolve-package.js';
import type { Driver } from '@directus/storage';

export async function getStorageExtensions(root: string, driver: Driver, storage_location: string): Promise<Extension[]> {
	const extensions: Extension[] = []

	const folders = new Set<string>()

	for await (const file of driver.list(root)) {
		const folder = file.split(sep)[1]
		if (!folder || !EXTENSION_NAME_REGEX.test(folder)) continue;

		folders.add(folder)
	}

	for (const folder of folders) {

		const extensionPath = path.join(root, folder);

		const manifestReadable = await driver.read(path.join(extensionPath, 'package.json'));

		const chunks = []

		for await (const chunk of manifestReadable) {
			chunks.push(chunk)
		}

		const manifest = Buffer.concat(chunks).toString("utf-8")

		const extension = parseExtension(folder, manifest, extensionPath, storage_location)

		extensions.push(extension)
	}

	return extensions
}

export async function getPackageExtensions(root: string): Promise<Extension[]> {
	let pkg: { dependencies?: Record<string, string> };

	try {
		pkg = await fse.readJSON(path.resolve(root, 'package.json'));
	} catch {
		throw new Error('Current folder does not contain a package.json file');
	}

	const extensionNames = Object.keys(pkg.dependencies ?? {}).filter((dep) => EXTENSION_NAME_REGEX.test(dep));

	const extensions: Extension[] = []

	for (const name of extensionNames) {
		const extensionPath = resolvePackage(name, root)
		const manifestPath = path.join(extensionPath, 'package.json')
		const manifest = await fse.readJSON(manifestPath)
		const extension = parseExtension(name, manifest, extensionPath)

		extensions.push(extension)
	}

	return extensions
}

export function parseExtension(name: string, manifest: string, extensionPath: string, storage_location?: string): Extension {
	let parsedManifest;

	try {
		parsedManifest = ExtensionManifest.parse(JSON.parse(manifest));
	} catch (error: any) {
		throw new Error(`The extension manifest of "${name}" is not valid.\n${error.message}`);
	}

	const extensionOptions = parsedManifest[EXTENSION_PKG_KEY];

	if (extensionOptions.type === 'bundle') {
		return {
			path: extensionPath,
			name: parsedManifest.name,
			description: parsedManifest.description || '',
			icon: parsedManifest.icon || '',
			version: parsedManifest.version,
			type: extensionOptions.type,
			entrypoint: {
				app: extensionOptions.path.app,
				api: extensionOptions.path.api,
			},
			entries: extensionOptions.entries,
			host: extensionOptions.host,
			secure: extensionOptions.secure === true,
			debugger: extensionOptions.debugger === true,
			requested_permissions: extensionOptions.permissions ?? [],
			storage_location
		}
	} else if (isTypeIn(extensionOptions, HYBRID_EXTENSION_TYPES)) {
		return {
			path: extensionPath,
			name: parsedManifest.name,
			description: parsedManifest.description ?? '',
			icon: parsedManifest.icon ?? '',
			version: parsedManifest.version,
			type: extensionOptions.type,
			entrypoint: {
				app: extensionOptions.path.app,
				api: extensionOptions.path.api,
			},
			host: extensionOptions.host,
			secure: extensionOptions.secure === true,
			debugger: extensionOptions.debugger === true,
			requested_permissions: extensionOptions.permissions ?? [],
			storage_location,
		}
	} else {
		return {
			path: extensionPath,
			name: parsedManifest.name,
			description: parsedManifest.description ?? '',
			icon: parsedManifest.icon ?? '',
			version: parsedManifest.version,
			type: extensionOptions.type,
			entrypoint: extensionOptions.path,
			host: extensionOptions.host,
			secure: extensionOptions.secure === true,
			debugger: extensionOptions.debugger === true,
			requested_permissions: extensionOptions.permissions ?? [],
			storage_location,
		}
	}
}
